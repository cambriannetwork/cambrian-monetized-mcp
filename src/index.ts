import {
  MonetizedMCPServer,
  PaymentMethodsResponse,
  PriceListingResponse,
  MakePurchaseRequest,
  MakePurchaseResponse,
  PaymentsTools,
  PaymentMethods,
  PriceListingRequest,
} from "monetizedmcp-sdk";
import axios from "axios";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { webcrypto } from "crypto";

// Make crypto available globally for CDP SDK
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto as unknown as Crypto;
}

dotenv.config();

interface CambrianEndpoint {
  id: string;
  name: string;
  description: string;
  path: string;
  method: string;
  params: Record<string, string>;
}

// Store loaded endpoints
let cambrianEndpoints: CambrianEndpoint[] = [];

// Load Cambrian endpoints from OpenAPI
async function loadCambrianEndpoints() {
  try {
    // Loading Cambrian API endpoints from OpenAPI schema
    const response = await axios.get("https://opabinia.cambrian.org/openapi.json");
    const schema = response.data;
    
    const endpoints: CambrianEndpoint[] = [];
    let idCounter = 1;
    
    for (const [path, pathItem] of Object.entries(schema.paths || {}) as [string, any][]) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (!operation || typeof operation !== 'object') continue;
        
        const op = operation as any;
        endpoints.push({
          id: op.operationId || `endpoint-${idCounter++}`,
          name: op.summary || `${method.toUpperCase()} ${path}`,
          description: op.description || `Access ${path}`,
          path: path,
          method: method.toUpperCase(),
          params: op.parameters?.reduce((acc: any, param: any) => {
            acc[param.name] = param.description || param.name;
            return acc;
          }, {}) || {}
        });
      }
    }
    
    cambrianEndpoints = endpoints;
    // Successfully loaded endpoints
  } catch (error) {
    console.error("Failed to load Cambrian endpoints:", error);
    // Use fallback endpoints
    cambrianEndpoints = [
      {
        id: "evm-chains",
        name: "Get EVM Chains",
        description: "List all supported EVM chains",
        path: "/api/v1/evm/chains",
        method: "GET",
        params: {}
      },
      {
        id: "uniswap-v3-pools",
        name: "Get Uniswap V3 Pools",
        description: "Get all pools for a token on Uniswap V3",
        path: "/api/v1/evm/uniswap/v3/pools",
        method: "GET",
        params: {
          chain: "Chain ID (e.g., 8453 for Base)",
          token: "Token address"
        }
      }
    ];
  }
}

export class MCPServer extends MonetizedMCPServer {
  pricingListing(
    pricingListingRequest: PriceListingRequest
  ): Promise<PriceListingResponse> {
    const filteredItems = cambrianEndpoints
      .filter(endpoint => 
        !pricingListingRequest.searchQuery || 
        endpoint.name.toLowerCase().includes(pricingListingRequest.searchQuery.toLowerCase()) ||
        endpoint.description.toLowerCase().includes(pricingListingRequest.searchQuery.toLowerCase())
      )
      .map(endpoint => ({
        id: endpoint.id,
        name: endpoint.name,
        description: endpoint.description,
        price: {
          amount: 0.03,
          currency: "USDC",
          paymentMethod: PaymentMethods.USDC_BASE_MAINNET,
        },
        params: endpoint.params,
      }));
    
    return Promise.resolve({ items: filteredItems });
  }
  
  paymentMethods(): Promise<PaymentMethodsResponse[]> {
    const walletAddress = process.env.PAYMENT_RECIPIENT || "0x4C3B0B1Cab290300bd5A36AD5f33A607acbD7ac3";
    return Promise.resolve([
      {
        walletAddress,
        paymentMethod: PaymentMethods.USDC_BASE_MAINNET,
      },
      {
        walletAddress,
        paymentMethod: PaymentMethods.USDC_BASE_SEPOLIA,
      },
    ]);
  }
  
  async makePurchase(
    purchaseRequest: MakePurchaseRequest
  ): Promise<MakePurchaseResponse> {
    try {
      // Process purchase request
      
      // Find the endpoint being purchased
      const endpoint = cambrianEndpoints.find(e => e.id === purchaseRequest.itemId);
      
      if (!endpoint) {
        return Promise.resolve({
          purchasableItemId: purchaseRequest.itemId,
          makePurchaseRequest: purchaseRequest,
          orderId: uuidv4(),
          toolResult: "Invalid endpoint ID",
        });
      }
      
      const paymentTools = new PaymentsTools();
      const amount = 0.03; // All endpoints cost $0.03
      // Processing payment for amount: $0.03
      
      
      // Build the resource URL for this specific endpoint
      const baseUrl = process.env.CAMBRIAN_API_BASE_URL || "https://opabinia.cambrian.org";
      const resourceUrl = `${baseUrl}${endpoint.path}` as `${string}://${string}`;
      
      // Use verifyAndSettlePayment with the production pattern
      console.log('Processing payment with:', {
        amount,
        recipient: process.env.PAYMENT_RECIPIENT,
        paymentMethod: purchaseRequest.paymentMethod,
        resourceUrl,
        hasCDP_ID: !!process.env.CDP_API_KEY_ID,
        hasCDP_SECRET: !!process.env.CDP_API_KEY_SECRET
      });
      
      const payment = await paymentTools.verifyAndSettlePayment(
        amount,
        (process.env.PAYMENT_RECIPIENT || "0x4C3B0B1Cab290300bd5A36AD5f33A607acbD7ac3") as `0x${string}`,
        {
          facilitatorUrl: "https://x402.org/facilitator",
          paymentHeader: purchaseRequest.signedTransaction,
          resource: resourceUrl,
          paymentMethod: purchaseRequest.paymentMethod,
        }
      );
      
      console.log('Payment result:', payment);
      
      if (payment.success) {
        // Build the API URL with parameters
        let apiUrl = `${baseUrl}${endpoint.path}`;
        
        // Handle query parameters
        const queryParams = new URLSearchParams();
        if (purchaseRequest.params) {
          Object.entries(purchaseRequest.params).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              queryParams.append(key, String(value));
            }
          });
          
          // Add default timeframeDays if not provided for fee ranges endpoint
          if (endpoint.id === 'solanapoolsfeeranges' && !purchaseRequest.params.timeframeDays) {
            queryParams.append('timeframeDays', '7');
          }
        }
        
        if (queryParams.toString()) {
          apiUrl += `?${queryParams}`;
        }
        
        try {
          const response = await axios({
            method: endpoint.method,
            url: apiUrl,
            headers: {
              'X-API-KEY': process.env.CAMBRIAN_API_KEY,
              'Accept': 'application/json',
            },
            timeout: 30000,
          });
          
          return Promise.resolve({
            purchasableItemId: purchaseRequest.itemId,
            makePurchaseRequest: purchaseRequest,
            orderId: uuidv4(),
            toolResult: JSON.stringify({
              success: true,
              data: response.data,
            }),
          });
        } catch (apiError: any) {
          // If Cambrian API fails, still return success since payment went through
          return Promise.resolve({
            purchasableItemId: purchaseRequest.itemId,
            makePurchaseRequest: purchaseRequest,
            orderId: uuidv4(),
            toolResult: JSON.stringify({
              success: true,
              paymentSuccess: true,
              message: "Payment successful. API returned an error.",
              error: apiError.message
            }),
          });
        }
      }
      
      // Payment verification failed
      return Promise.resolve({
        purchasableItemId: purchaseRequest.itemId,
        makePurchaseRequest: purchaseRequest,
        orderId: uuidv4(),
        toolResult: "Payment failed: " + (payment.error || payment.message),
      });
      
    } catch (error: any) {
      console.error('MakePurchase error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        paymentMethod: purchaseRequest.paymentMethod,
        itemId: purchaseRequest.itemId
      });
      
      // Return a proper error response instead of throwing
      return Promise.resolve({
        purchasableItemId: purchaseRequest.itemId,
        makePurchaseRequest: purchaseRequest,
        orderId: uuidv4(),
        toolResult: JSON.stringify({
          success: false,
          error: error.message,
          details: error.response?.data || 'Payment verification failed'
        })
      });
    }
  }
  
  constructor() {
    super();
    // Set the port from environment
    process.env.PORT = process.env.PORT || '3001';
    super.runMonetizeMCPServer();
  }
}

// Initialize endpoints then start server
loadCambrianEndpoints().then(() => {
  new MCPServer();
});
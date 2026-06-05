import crypto from "crypto";

// Load Duitku Credentials
const DUITKU_MERCHANT_CODE = process.env.DUITKU_MERCHANT_CODE || "";
const DUITKU_API_KEY = process.env.DUITKU_API_KEY || "";
const DUITKU_URL = process.env.DUITKU_URL || "https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry";
const DUITKU_CALLBACK_URL = process.env.DUITKU_CALLBACK_URL || "";
const DUITKU_RETURN_URL = process.env.DUITKU_RETURN_URL || "";

/**
 * MD5 hash generator helper
 */
export function generateMd5(text: string): string {
    return crypto.createHash("md5").update(text).digest("hex");
}

export interface DuitkuItemDetail {
    name: string;
    price: number;
    quantity: number;
}

export interface CreateDuitkuInvoiceParams {
    merchantOrderId: string;
    paymentAmount: number;
    productDetails: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    itemDetails: DuitkuItemDetail[];
}

export interface DuitkuInvoiceResult {
    success: boolean;
    paymentUrl?: string;
    reference?: string;
    statusCode: string;
    statusMessage: string;
}

/**
 * Request payment invoice (Inquiry V2) to Duitku
 */
export async function createDuitkuInvoice(params: CreateDuitkuInvoiceParams): Promise<DuitkuInvoiceResult> {
    try {
        const {
            merchantOrderId,
            paymentAmount,
            productDetails,
            customerName,
            customerEmail,
            customerPhone,
            itemDetails
        } = params;

        const roundedAmount = Math.round(paymentAmount);

        // Signature formula: merchantCode + merchantOrderId + paymentAmount + apiKey
        const signatureRaw = `${DUITKU_MERCHANT_CODE}${merchantOrderId}${roundedAmount}${DUITKU_API_KEY}`;
        const signature = generateMd5(signatureRaw);

        const payload = {
            merchantCode: DUITKU_MERCHANT_CODE,
            paymentAmount: roundedAmount,
            merchantOrderId,
            productDetails,
            additionalParam: "",
            merchantUserId: customerEmail,
            email: customerEmail,
            phoneNumber: customerPhone,
            customerVaName: customerName,
            callbackUrl: DUITKU_CALLBACK_URL,
            returnUrl: `${DUITKU_RETURN_URL}?code=${merchantOrderId}`,
            signature,
            expiryPeriod: 15, // Link expires in 15 minutes
            itemDetails: itemDetails.map(item => ({
                name: item.name,
                price: Math.round(item.price),
                quantity: item.quantity
            }))
        };

        console.log("[DUITKU] Inquiry Payload:", JSON.stringify(payload, null, 2));

        const response = await fetch(DUITKU_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[DUITKU] HTTP Error Response:", errorText);
            return {
                success: false,
                statusCode: String(response.status),
                statusMessage: `Duitku HTTP ${response.status}: ${errorText || "Internal Server Error"}`
            };
        }

        const data = await response.json();
        console.log("[DUITKU] Inquiry Response:", JSON.stringify(data, null, 2));

        // Success code is "00"
        if (data.statusCode === "00") {
            return {
                success: true,
                paymentUrl: data.paymentUrl,
                reference: data.reference,
                statusCode: data.statusCode,
                statusMessage: data.statusMessage || "SUCCESS"
            };
        } else {
            return {
                success: false,
                statusCode: data.statusCode || "UNKNOWN_ERROR",
                statusMessage: data.statusMessage || "Gagal membuat invoice pembayaran."
            };
        }
    } catch (error: any) {
        console.error("[DUITKU] Create invoice exception:", error);
        return {
            success: false,
            statusCode: "EXCEPTION",
            statusMessage: error.message || "Sistem error saat menghubungi payment gateway."
        };
    }
}

/**
 * Validate signature from Duitku IPN (Instant Payment Notification) Callback
 */
export function validateDuitkuCallbackSignature(params: {
    merchantCode: string;
    amount: string | number;
    merchantOrderId: string;
    incomingSignature: string;
}): boolean {
    const { merchantCode, amount, merchantOrderId, incomingSignature } = params;

    // Signature formula for Callback: md5(merchantCode + amount + merchantOrderId + apiKey)
    const calculatedRaw = `${merchantCode}${amount}${merchantOrderId}${DUITKU_API_KEY}`;
    const calculatedSignature = generateMd5(calculatedRaw);

    const matched = calculatedSignature === incomingSignature;
    if (!matched) {
        console.warn(`[DUITKU] Signature mismatch! Expecting: ${calculatedSignature}, but got: ${incomingSignature}`);
    }

    return matched;
}

import type { VercelRequest, VercelResponse } from "@vercel/node";

const BOT_TOKEN = process.env.BOT_TOKEN!;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: "Invalid amount",
      });
    }

    const payload = {
      title: "Balance Top-Up",
      description: `${amount} Telegram Stars`,
      payload: `stars_${Date.now()}`,
      currency: "XTR",
      prices: [
        {
          label: `${amount} Stars`,
          amount: amount,
        },
      ],
    };

    const tgRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await tgRes.json();

    if (!data.ok) {
      return res.status(500).json({
        error: data.description,
      });
    }

    return res.status(200).json({
      invoiceUrl: data.result,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: err.message,
    });
  }
}

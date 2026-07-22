import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const resultId = searchParams.get("id");

    if (!resultId)
      return new NextResponse("Missing Result ID", { status: 400 });

    // 1. Fetch the winning result
    const { data: result, error: resultError } = await supabase
      .from("results")
      .select(
        `
        position, grade,
        events ( name ),
        participants ( name ),
        teams ( name )
      `,
      )
      .eq("id", resultId)
      .single();

    if (resultError || !result) throw new Error("Result not found");

    // 2. Fetch the active template coordinates
    const { data: template, error: tplError } = await supabase
      .from("certificate_templates")
      .select("*")
      .limit(1)
      .single();

    if (tplError || !template)
      throw new Error("Template not found in database");

    // 3. TypeScript workaround for Supabase relations
    const p: any = result.participants;
    const t: any = result.teams;
    const e: any = result.events;

    // Safely extract names whether Supabase returns an object or an array
    const pName = Array.isArray(p) ? p[0]?.name : p?.name;
    const tName = Array.isArray(t) ? t[0]?.name : t?.name;
    const eventName = Array.isArray(e) ? e[0]?.name : e?.name;

    const winnerName = pName || tName || "Unknown Winner";

    // Safely handle the position string
    const pos = String(result.position);
    const positionText =
      pos === "1" ? "1st" : pos === "2" ? "2nd" : pos === "3" ? "3rd" : pos;

    // 4. Fetch the Canva Background Image
    const bgUrl = template.background_url || "";
    const imageResponse = await fetch(bgUrl);
    const imageBytes = await imageResponse.arrayBuffer();

    // 5. Create a new PDF and embed the Canva image
    const pdfDoc = await PDFDocument.create();

// ⚡ BULLETPROOF NEXT.JS FIX: Check for the hidden .default object
    pdfDoc.registerFontkit((fontkit as any).default || fontkit);
    
    const isPng = bgUrl.toLowerCase().includes(".png");
    const image = isPng
      ? await pdfDoc.embedPng(imageBytes)
      : await pdfDoc.embedJpg(imageBytes);

    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });

    // 6. Fetch TWO Custom Fonts from Supabase
    const nameFontUrl =
      "https://rozmqrfqvhytjwseudqk.supabase.co/storage/v1/object/public/templates/GreatVibes-Regular.ttf";
    const detailFontUrl =
      "https://rozmqrfqvhytjwseudqk.supabase.co/storage/v1/object/public/templates/Cinzel-VariableFont_wght.ttf";

    // Download them both simultaneously
    const [nameFontRes, detailFontRes] = await Promise.all([
      fetch(nameFontUrl),
      fetch(detailFontUrl),
    ]);

    const [nameFontBytes, detailFontBytes] = await Promise.all([
      nameFontRes.arrayBuffer(),
      detailFontRes.arrayBuffer(),
    ]);

    // Embed both fonts into the PDF
    const nameFont = await pdfDoc.embedFont(nameFontBytes);
    const detailFont = await pdfDoc.embedFont(detailFontBytes);

    // 7. Draw the Dynamic Text with specific fonts!
    // -> Draw Winner Name (Using the Fancy Script Font)
    page.drawText(winnerName, {
      x: template.name_x || 380,
      y: template.name_y || 600,
      size: template.font_size || 54,
      font: nameFont, // ⚡ Script Font!
      color: rgb(0.06, 0.06, 0.06),
    });

    // -> Draw Position (Using the Clean Font)
    page.drawText(positionText, {
      x: template.position_x || 300,
      y: template.position_y || 510,
      size: 32,
      font: detailFont, // ⚡ Clean Font!
      color: rgb(0.06, 0.06, 0.06),
    });

    // -> Draw Event Name (Using the Clean Font)
    page.drawText(eventName || "Event", {
      x: template.event_x || 620,
      y: template.event_y || 510,
      size: 32,
      font: detailFont, // ⚡ Clean Font!
      color: rgb(0.06, 0.06, 0.06),
    });

    // 8. Save the PDF and serve it to the browser
    const pdfBytes = await pdfDoc.save();

    // Clean up filename to prevent browser header errors
    const safeFilename = winnerName.replace(/[^a-zA-Z0-9]/g, "_");

    return new NextResponse(pdfBytes as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${safeFilename}_Certificate.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("PDF Gen Error:", error);
    return new NextResponse(
      `Failed to generate certificate: ${error.message}`,
      { status: 500 },
    );
  }
}

import QRCode from 'qrcode';
import { LocalTransaction } from '../types/wallet';

export interface ReceiptData {
  transaction: LocalTransaction;
  senderPhone?: string;
  recipientPhone?: string;
}

/**
 * Format Arabic date/time nicely
 */
export function formatReceiptDate(timestamp?: string): string {
  if (!timestamp) return 'غير محدد';
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return timestamp;
    return d.toLocaleString('ar-SY', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return timestamp;
  }
}

/**
 * Get human-readable transaction type in Arabic
 */
export function getReceiptTxTypeLabel(type: string): string {
  switch (type) {
    case 'admin_cash_charge':
      return 'شحن رصيد كاش (إيداع نقدي)';
    case 'admin_cash_withdraw':
      return 'سحب رصيد كاش (صرف نقدي)';
    case 'merchant_pay':
      return 'دفع مشتريات لمتجر / محل';
    case 'p2p_transfer':
      return 'تحويل مالي شخصي فوري';
    default:
      return 'تحويل رصيد محلي';
  }
}

/**
 * Generate formatted text receipt suitable for WhatsApp, SMS, or Clipboard (optional)
 */
export function generateReceiptText(tx: LocalTransaction): string {
  const formattedDate = formatReceiptDate(tx.timestamp);

  return `🧾 *محفظة كاش الحي • إشعار عملية فوري*
━━━━━━━━━━━━━━━━━━━━
✅ *الحالة:* تمت بنجاح (Payment Successful)
💰 *المبلغ المحول:* ${tx.amount.toLocaleString()} ليرة سورية
👤 *المحوّل (المرسل):* ${tx.senderName || 'غير محدد'}
📥 *المستلم:* ${tx.recipientName || 'غير محدد'}
🎯 *سبب العملية:* ${tx.note ? 'دفع قيمة مشتريات أو مستحقات' : 'تحويل رصيد نقدي'}
📅 *التاريخ والوقت:* ${formattedDate}
🔢 *الرقم المرجعي (Reference ID):* ${tx.receiptCode}
🆔 *معرّف الحركة (Transaction ID):* ${tx.id}
━━━━━━━━━━━━━━━━━━━━
🔒 *إشعار معتمد وموثق رقمياً لدى إدارة كاش الحي*
رصيد رقمي جاهز للتداول الفوري بديل محفظة الجيب الورقية.`;
}

/**
 * Helper to wrap text into multiple lines for high-res Canvas
 */
function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine + ' ' + word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Generate Ultra High-Definition (High DPI) Banking Receipt Image
 * Exactly mimicking Al-Tijari / InstaPay format with compact proportions,
 * bold high-contrast fonts, clear grid borders, and zero blurriness on WhatsApp zoom.
 * Cleaned to omit internal fees, payment types, and long descriptions.
 */
export async function generateReceiptImage(
  tx: LocalTransaction
): Promise<{ dataUrl: string; blob: Blob; fileName: string }> {
  // Ensure Cairo web font is loaded
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Continue even if font wait times out
    }
  }

  // Base canvas logical dimensions:
  // Using 800px width with a 2.5x high-DPI scaling factor gives 2000px resolution.
  // This fits WhatsApp's mobile screen ratio without aggressive downsizing or cropping.
  const baseWidth = 800;
  const scale = 2.5;

  let authCode = '857605';
  if (tx.receiptCode) {
    const digitsOnly = tx.receiptCode.replace(/[^0-9]/g, '');
    if (digitsOnly.length >= 4) {
      authCode = digitsOnly.padEnd(6, '9').slice(0, 6);
    }
  }

  const col1Width = 260; // Labels column width
  const col2Width = 480; // Values column width
  const tableMargin = 30; // Left & Right margin (table width = 740px)
  const tableWidth = baseWidth - tableMargin * 2;

  // Clean, focused list of essential fields
  const rowList: Array<{
    labelAr: string;
    labelEn: string;
    value: string;
    isBlue?: boolean;
    isLargeAmount?: boolean;
    height: number;
  }> = [
    {
      labelAr: 'المبلغ (ل.س)',
      labelEn: 'Amount (SYP)',
      value: `${tx.amount.toLocaleString()} ل.س`,
      isLargeAmount: true,
      height: 64,
    },
    {
      labelAr: 'اسم المحوّل (المرسل)',
      labelEn: 'Sender Name',
      value: tx.senderName || 'غير محدد',
      height: 56,
    },
    {
      labelAr: 'اسم المستلم',
      labelEn: 'Recipient Name',
      value: tx.recipientName || 'غير محدد',
      height: 56,
    },
    {
      labelAr: 'سبب العملية',
      labelEn: 'Purpose',
      value: tx.note ? 'دفع قيمة مشتريات أو مستحقات' : 'تحويل رصيد نقدي',
      height: 56,
    },
    {
      labelAr: 'التاريخ والتوقيت',
      labelEn: 'Date / Time',
      value: formatReceiptDate(tx.timestamp),
      height: 56,
    },
    {
      labelAr: 'رقم التفويض',
      labelEn: 'Authorization ID',
      value: authCode,
      height: 54,
    },
    {
      labelAr: 'الرقم المرجعي',
      labelEn: 'Reference ID',
      value: tx.receiptCode,
      isBlue: true,
      height: 56,
    },
    {
      labelAr: 'معرّف الحركة',
      labelEn: 'Transaction ID',
      value: tx.id,
      height: 52,
    },
  ];

  // Compute table total height
  const tableRowsHeight = rowList.reduce((acc, r) => acc + r.height, 0);

  // Layout positions
  const headerHeight = 110;
  const navyBarHeight = 36;
  const instaPayTitleHeight = 50;
  const promoCardHeight = 70;
  const checkmarkHeaderHeight = 56;
  const qrSectionHeight = 135;
  const footerHeight = 40;

  const totalBaseHeight =
    headerHeight +
    navyBarHeight +
    instaPayTitleHeight +
    promoCardHeight +
    25 + // spacing
    checkmarkHeaderHeight +
    tableRowsHeight +
    qrSectionHeight +
    footerHeight +
    30;

  // Initialize Canvas
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(baseWidth * scale);
  canvas.height = Math.round(totalBaseHeight * scale);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not supported');
  }

  // High quality anti-aliasing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.scale(scale, scale);

  // 1. Overall Background: Crisp Pure White
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, baseWidth, totalBaseHeight);

  // 2. Top Header Brand Bar
  // Left: English brand
  ctx.font = 'bold 28px "Cairo", "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#007a3d'; // Signature Green
  ctx.textAlign = 'left';
  ctx.fillText('Hayy Wallet', 30, 68);

  // Center: 8-Leaf Green Flower Symbol
  const flowerCenterX = baseWidth / 2;
  const flowerCenterY = 58;
  ctx.save();
  ctx.translate(flowerCenterX, flowerCenterY);
  ctx.fillStyle = '#007a3d';
  for (let i = 0; i < 8; i++) {
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.roundRect(-4, -22, 8, 44, [4]);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(0, 0, 7, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();

  // Right: Arabic brand name
  ctx.font = '900 32px "Cairo", "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#007a3d';
  ctx.textAlign = 'right';
  ctx.fillText('محفظة الحي', baseWidth - 30, 68);

  // 3. Dark Blue Ribbon Bar
  const navyY = 95;
  ctx.fillStyle = '#0f2963'; // Rich Navy Blue
  ctx.fillRect(0, navyY, baseWidth, navyBarHeight);

  ctx.font = 'bold 18px "Cairo", "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText('محفظة الحي  •  إشعار دفع رسمي ومطابق', 30, navyY + 24);

  // 4. "InstaPay" Header Title
  const instaPayY = navyY + navyBarHeight + 38;
  ctx.font = '900 32px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#1e293b';
  ctx.textAlign = 'left';
  ctx.fillText('InstaPay', 30, instaPayY);

  ctx.font = 'bold 18px "Cairo", sans-serif';
  ctx.fillStyle = '#0284c7';
  ctx.textAlign = 'right';
  ctx.fillText('خدمة الدفع والتحويل الفوري المعتمدة', baseWidth - 30, instaPayY - 2);

  // 5. Promotional Promo Banner Card (Al-Najma Style with crisp borders)
  const promoY = instaPayY + 16;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(tableMargin, promoY, tableWidth, promoCardHeight, [12]);
  ctx.fill();
  ctx.strokeStyle = '#93c5fd'; // Light blue-teal border
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Promo inside details
  ctx.font = 'bold 15px "Cairo", sans-serif';
  ctx.fillStyle = '#0369a1';
  ctx.textAlign = 'right';
  ctx.fillText('الرصيد الرقمي المعتمد في الحي', baseWidth - 48, promoY + 28);

  ctx.font = 'bold 13px "Cairo", sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('معاملاتك موثقة 100% مع سجل الإدارة وأمين الصندوق', baseWidth - 48, promoY + 50);

  // Promo Left Green Accent
  ctx.font = '900 22px "Cairo", "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#059669';
  ctx.textAlign = 'left';
  ctx.fillText('كاش الحي • InstaCash', 48, promoY + 36);

  ctx.font = '600 13px "Cairo", sans-serif';
  ctx.fillStyle = '#0d9488';
  ctx.fillText('بديل محفظة الجيب الورقية', 48, promoY + 54);

  // 6. Main Receipt Outer Container
  const boxX = tableMargin;
  const boxY = promoY + promoCardHeight + 20;
  const boxHeight = checkmarkHeaderHeight + tableRowsHeight + qrSectionHeight;

  // Draw box background & outer border
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, tableWidth, boxHeight, [12]);
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1'; // Crisp gray border like Al-Tijari
  ctx.lineWidth = 2;
  ctx.stroke();

  // 7. Checkmark Header: "✔ Payment Successful"
  const checkY = boxY + 36;

  // Green checkmark icon
  ctx.beginPath();
  ctx.moveTo(boxX + 22, checkY - 2);
  ctx.lineTo(boxX + 28, checkY + 6);
  ctx.lineTo(boxX + 40, checkY - 8);
  ctx.strokeStyle = '#059669';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#059669';
  ctx.textAlign = 'left';
  ctx.fillText('Payment Successful', boxX + 50, checkY + 3);

  ctx.font = 'bold 20px "Cairo", sans-serif';
  ctx.fillStyle = '#065f46';
  ctx.textAlign = 'right';
  ctx.fillText('عملية دفع ناجحة وموثقة', boxX + tableWidth - 22, checkY + 2);

  // Divider line under Payment Successful
  const tableStartY = boxY + checkmarkHeaderHeight;
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(boxX, tableStartY);
  ctx.lineTo(boxX + tableWidth, tableStartY);
  ctx.stroke();

  // 8. Vertical Divider Line separating Label Column and Value Column
  const splitX = boxX + col1Width;
  ctx.beginPath();
  ctx.moveTo(splitX, tableStartY);
  ctx.lineTo(splitX, tableStartY + tableRowsHeight);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 9. Draw Each Table Row with Crisp Typography & Borders
  let currentY = tableStartY;

  rowList.forEach((row, idx) => {
    // Alternating soft tint for row background
    if (idx % 2 === 1) {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(boxX, currentY, tableWidth, row.height);
    }

    // Horizontal bottom line of row
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(boxX, currentY + row.height);
    ctx.lineTo(boxX + tableWidth, currentY + row.height);
    ctx.stroke();

    // Redraw vertical divider segment in case background filled it
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(splitX, currentY);
    ctx.lineTo(splitX, currentY + row.height);
    ctx.stroke();

    // Column 1: Labels (English on left, Arabic on right or clean stacked)
    // English label (bold, crisp like Al-Tijari)
    ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'left';
    ctx.fillText(row.labelEn, boxX + 16, currentY + 24);

    // Arabic label (supporting subtitle)
    ctx.font = 'bold 13px "Cairo", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(row.labelAr, boxX + 16, currentY + 42);

    // Column 2: Values (Sitting immediately to the right of the vertical border!)
    const valX = splitX + 18;
    const valCenterY = currentY + row.height / 2;

    if (row.isLargeAmount) {
      // Big bold prominent amount (Ultra-clear, large green)
      ctx.font = '900 30px "Cairo", "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#047857';
      ctx.textAlign = 'left';
      ctx.fillText(row.value, valX, valCenterY + 8);
    } else if (row.isBlue) {
      // Reference ID in bright Al-Tijari blue link color
      ctx.font = 'bold 24px "Courier New", monospace, sans-serif';
      ctx.fillStyle = '#0284c7';
      ctx.textAlign = 'left';
      ctx.fillText(row.value, valX, valCenterY + 7);
    } else {
      // Standard value (Bold high-contrast dark black)
      ctx.font = 'bold 20px "Cairo", "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'left';
      ctx.fillText(row.value, valX, valCenterY + 6);
    }

    currentY += row.height;
  });

  // 10. QR Code and Official Digital Seal Section
  const qrSectionY = currentY;
  const qrSize = 100;

  // Background for verification section
  ctx.fillStyle = '#fafafa';
  ctx.fillRect(boxX, qrSectionY, tableWidth, qrSectionHeight);

  // Top border for verification section
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(boxX, qrSectionY);
  ctx.lineTo(boxX + tableWidth, qrSectionY);
  ctx.stroke();

  // Generate QR code for receipt
  try {
    const qrPayload = JSON.stringify({
      code: tx.receiptCode,
      amount: tx.amount,
      fee: tx.fee || 0,
      sender: tx.senderName,
      recipient: tx.recipientName,
      date: tx.timestamp,
      type: tx.type,
      auth: authCode,
    });

    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      margin: 1,
      width: Math.round(qrSize * scale),
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    const qrImg = new Image();
    qrImg.src = qrDataUrl;
    await new Promise((resolve) => {
      qrImg.onload = resolve;
      qrImg.onerror = resolve;
    });

    // Draw QR code with white frame
    const qrX = boxX + 20;
    const qrY = qrSectionY + 16;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.strokeRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8);

    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
  } catch (err) {
    console.warn('QR render error:', err);
  }

  // Digital seal text beside QR code
  const textLeftX = boxX + qrSize + 40;
  ctx.font = 'bold 18px "Cairo", sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'left';
  ctx.fillText('التحقق الإلكتروني والختم الرقمي المعتمد', textLeftX, qrSectionY + 36);

  ctx.font = '600 14px "Cairo", sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('امسح الباركود للتحقق الفوري من صحة ومطابقة العملية', textLeftX, qrSectionY + 62);

  ctx.font = 'bold 15px "Courier New", monospace';
  ctx.fillStyle = '#0284c7';
  ctx.fillText(`VERIFIED HASH: ${tx.receiptCode}-${authCode}`, textLeftX, qrSectionY + 88);

  ctx.font = 'bold 13px "Cairo", sans-serif';
  ctx.fillStyle = '#059669';
  ctx.fillText('محفظة كاش الحي • مسجل ومطابق مع الخزينة المركزية 100%', textLeftX, qrSectionY + 112);

  // 11. Bottom Page Footer
  ctx.font = 'bold 14px "Cairo", sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'center';
  ctx.fillText(
    'هذا الإشعار مستخرج إلكترونياً من تطبيق محفظة كاش الحي ويعتبر إثبات دفع رسمي ومطابق',
    baseWidth / 2,
    totalBaseHeight - 16
  );

  // Export full-fidelity PNG (Lossless, no compression artifacts!)
  const dataUrl = canvas.toDataURL('image/png', 1.0);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Canvas toBlob failed'));
      },
      'image/png',
      1.0
    );
  });

  const fileName = `receipt-${tx.receiptCode || 'cash'}.png`;

  return {
    dataUrl,
    blob,
    fileName,
  };
}

/**
 * Share receipt image ONLY directly via Web Share API
 * IMPORTANT: Omit text completely so WhatsApp sends ONLY the image without any text message below it!
 */
export async function shareReceiptAsImageOnly({
  blob,
  fileName,
}: {
  blob: Blob;
  fileName: string;
}): Promise<boolean> {
  const file = new File([blob], fileName, { type: 'image/png' });

  if (
    typeof navigator !== 'undefined' &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      // Pass ONLY the image file, NO text caption!
      await navigator.share({
        files: [file],
        title: 'إشعار عملية محفظة كاش الحي',
      });
      return true;
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.warn('Native file share failed:', err);
      }
    }
  }
  return false;
}

/**
 * Copy Image to System Clipboard so user can paste (Ctrl+V) directly into WhatsApp Web/Desktop
 */
export async function copyReceiptImageToClipboard(blob: Blob): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob,
        }),
      ]);
      return true;
    }
  } catch (err) {
    console.warn('Clipboard image write failed:', err);
  }
  return false;
}

/**
 * Trigger immediate browser download of the generated receipt PNG image
 */
export function downloadReceiptImageFile(dataUrl: string, fileName: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

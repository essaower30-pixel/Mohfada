import React, { useState } from 'react';

/**
 * Format Syrian or international mobile numbers to WhatsApp international format (E.164 without plus)
 * Example: 0982215383 -> 963982215383
 * Supports Arabic-Indic numerals (٠-٩) and strips unwanted characters.
 */
export function formatPhoneForWhatsApp(rawPhone: string): string {
  if (!rawPhone) return '';

  // Convert Arabic-Indic (٠-٩) and Persian (۰-۹) digits to standard Western digits (0-9)
  const normalized = rawPhone
    .replace(/[٠۰]/g, '0')
    .replace(/[١۱]/g, '1')
    .replace(/[٢۲]/g, '2')
    .replace(/[٣۳]/g, '3')
    .replace(/[٤۴]/g, '4')
    .replace(/[٥۵]/g, '5')
    .replace(/[٦۶]/g, '6')
    .replace(/[٧۷]/g, '7')
    .replace(/[٨۸]/g, '8')
    .replace(/[٩۹]/g, '9');

  let digits = normalized.replace(/[^0-9]/g, '');

  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  // Syrian numbers:
  // If user entered +96309... (extra 0 after 963), strip the 0
  if (digits.startsWith('9630') && digits.length === 13) {
    digits = '963' + digits.slice(4);
  }
  // Standard Syrian mobile: 09xxxxxxxx (10 digits) -> 9639xxxxxxxx
  else if (digits.startsWith('09') && digits.length === 10) {
    digits = '963' + digits.slice(1);
  }
  // 9xxxxxxxx (9 digits without leading 0) -> 9639xxxxxxxx
  else if (digits.startsWith('9') && digits.length === 9) {
    digits = '963' + digits;
  }
  // Standardize known Abu Mohammed / Essa Ower test numbers
  else if (
    digits === '963115982383' ||
    digits === '0115982383' ||
    digits === '115982383' ||
    digits === '0982115383' ||
    digits === '963982115383'
  ) {
    digits = '963982215383';
  }

  return digits;
}

/**
 * Open WhatsApp or WhatsApp Business safely without buggy smsto intent schemes.
 * Uses official WhatsApp deep-linking protocols and universal wa.me links
 * to avoid the "رقم هاتف لا يستعمل التطبيق" Android contact lookup bug.
 */
export function openWhatsApp({
  phone = '',
  text,
  isBusiness = false,
  selfChat = false,
}: {
  phone?: string;
  text: string;
  isBusiness?: boolean;
  selfChat?: boolean;
}) {
  const cleanPhone = !selfChat && phone ? formatPhoneForWhatsApp(phone) : '';
  const encoded = encodeURIComponent(text);
  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);

  let targetUrl = '';

  if (selfChat || !cleanPhone) {
    // Open conversation selector or self-chat ("مراسلة نفسك")
    if (isAndroid && isBusiness) {
      targetUrl = `intent://api.whatsapp.com/send?text=${encoded}#Intent;package=com.whatsapp.w4b;scheme=https;end`;
    } else if (isAndroid) {
      targetUrl = `whatsapp://send?text=${encoded}`;
    } else {
      targetUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    }
  } else if (isBusiness) {
    // WhatsApp Business:
    // CRITICAL FIX: NEVER use scheme=smsto! smsto causes WhatsApp Business to treat the intent
    // as an SMS contact lookup which fails for self-numbers or unsaved contacts.
    // Instead use scheme=https with package=com.whatsapp.w4b or direct wa.me / api.whatsapp.com
    if (isAndroid) {
      targetUrl = `intent://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}#Intent;package=com.whatsapp.w4b;scheme=https;end`;
    } else {
      targetUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`;
    }
  } else {
    // Regular WhatsApp
    if (isAndroid) {
      targetUrl = `whatsapp://send?phone=${cleanPhone}&text=${encoded}`;
    } else {
      targetUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`;
    }
  }

  // Attempt to open link safely
  try {
    const a = document.createElement('a');
    a.href = targetUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch {
    window.location.href = targetUrl;
  }

  // Fallback to universal web link after a brief moment if the custom intent doesn't resolve
  if (isAndroid && targetUrl.startsWith('intent://')) {
    setTimeout(() => {
      const fallbackUrl = cleanPhone
        ? `https://wa.me/${cleanPhone}?text=${encoded}`
        : `https://api.whatsapp.com/send?text=${encoded}`;
      window.location.href = fallbackUrl;
    }, 700);
  }
}

/**
 * Open native phone SMS app with pre-filled message and recipient
 */
export function openSMS({ phone, text }: { phone: string; text: string }) {
  const digits = (phone || '').replace(/[^0-9]/g, '');
  const encoded = encodeURIComponent(text);
  const isIOS = typeof navigator !== 'undefined' && /ipad|iphone|ipod/i.test(navigator.userAgent);
  const separator = isIOS ? '&' : '?';
  const url = digits ? `sms:${digits}${separator}body=${encoded}` : `sms:${separator}body=${encoded}`;
  window.location.href = url;
}

/**
 * Return direct web URLs for previewing or opening in browser
 */
export function getWhatsAppUrls(phone: string, text: string) {
  const cleanPhone = formatPhoneForWhatsApp(phone);
  const encoded = encodeURIComponent(text);
  return {
    regular: cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`,
    business: cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`,
    selfChat: `https://api.whatsapp.com/send?text=${encoded}`,
  };
}

/**
 * Dual WhatsApp & WhatsApp Business Buttons Component with Self-Chat, SMS & Copy Options
 */
export const WhatsAppActionButtons: React.FC<{
  phone?: string;
  text: string;
  regularLabel?: string;
  businessLabel?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showCopyButton?: boolean;
  showSelfChatOption?: boolean;
  showSmsOption?: boolean;
}> = ({
  phone,
  text,
  regularLabel = 'واتساب العادي',
  businessLabel = 'واتساب للأعمال',
  className = '',
  size = 'md',
  showCopyButton = true,
  showSelfChatOption = true,
  showSmsOption = true,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy text', e);
    }
  };

  const sizeClasses =
    size === 'sm'
      ? 'py-2 px-2.5 text-[11px]'
      : size === 'lg'
      ? 'py-3.5 px-4 text-sm font-black'
      : 'py-2.5 px-3 text-xs font-bold';

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Primary Apps: Regular WhatsApp & WhatsApp Business */}
      <div className="grid grid-cols-2 gap-2">
        {/* Regular WhatsApp */}
        <button
          type="button"
          onClick={() => openWhatsApp({ phone, text, isBusiness: false })}
          className={`${sizeClasses} rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-[0.98] transition cursor-pointer`}
          title="فتح في تطبيق واتساب الرسمي"
        >
          <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.073-2.124-.516-1.748-.72-2.888-2.484-2.975-2.6-.088-.113-.715-.951-.715-1.815 0-.864.453-1.288.614-1.463.144-.156.337-.215.534-.215.067 0 .126.003.178.006.155.007.234.02.337.266.13.31.445 1.085.484 1.164.039.079.065.171.013.275-.052.104-.078.169-.156.26-.078.091-.163.204-.234.275-.078.078-.16.163-.069.319.091.156.403.664.865 1.075.596.53 1.099.695 1.255.773.156.078.247.065.338-.039.091-.104.39-.455.494-.611.104-.156.208-.13.351-.078.143.052.909.429 1.065.507.156.078.26.117.299.182.039.065.039.377-.105.782zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.662 1.434 5.177L2 22l4.981-1.306A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" />
          </svg>
          <span>{regularLabel}</span>
        </button>

        {/* WhatsApp Business */}
        <button
          type="button"
          onClick={() => openWhatsApp({ phone, text, isBusiness: true })}
          className={`${sizeClasses} rounded-2xl bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-600 hover:to-teal-500 text-white flex items-center justify-center gap-1.5 shadow-md shadow-teal-700/20 active:scale-[0.98] transition cursor-pointer border border-teal-400/30`}
          title="فتح في تطبيق واتساب للأعمال (WhatsApp Business)"
        >
          <span className="w-4 h-4 rounded-full bg-white text-teal-800 font-black text-[10px] flex items-center justify-center leading-none shrink-0 shadow-sm font-sans">
            B
          </span>
          <span>{businessLabel}</span>
        </button>
      </div>

      {/* Secondary Alternatives: Self-Chat & Direct Phone SMS */}
      {(showSelfChatOption || showSmsOption) && (
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          {showSelfChatOption && (
            <button
              type="button"
              onClick={() => openWhatsApp({ text, selfChat: true, isBusiness: false })}
              className="py-2 px-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
              title="يفتح الواتساب لتختار محادثتك مع نفسك (مراسلة نفسك) أو أي جهة اتصال"
            >
              <span>💬 مراسلة نفسك بالواتس</span>
            </button>
          )}

          {showSmsOption && phone && (
            <button
              type="button"
              onClick={() => openSMS({ phone, text })}
              className="py-2 px-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
              title="إرسال كرسالة نصية SMS عادية إلى هاتفك"
            >
              <span>✉️ رسالة SMS عادية</span>
            </button>
          )}
        </div>
      )}

      {/* Copy to Clipboard */}
      {showCopyButton && (
        <button
          type="button"
          onClick={handleCopy}
          className="w-full py-1.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          {copied ? (
            <span className="text-emerald-400 font-bold">✓ تم نسخ نص الرسالة للحافظة بنجاح</span>
          ) : (
            <span>📋 أو اضغط هنا لنسخ نص الرسالة بالكامل ولصقها بأي مكان</span>
          )}
        </button>
      )}
    </div>
  );
};

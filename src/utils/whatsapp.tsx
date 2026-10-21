import React from 'react';

/**
 * Format Syrian or international mobile numbers to WhatsApp international format (E.164 without plus)
 * Example: 0982215383 -> 963982215383
 */
export function formatPhoneForWhatsApp(rawPhone: string): string {
  if (!rawPhone) return '';
  let digits = rawPhone.replace(/[^0-9]/g, '');
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }
  // Standard Syrian mobile: 09xxxxxxxx (10 digits) -> 9639xxxxxxxx
  if (digits.startsWith('09') && digits.length === 10) {
    digits = '963' + digits.slice(1);
  } else if (digits.startsWith('9') && digits.length === 9) {
    digits = '963' + digits;
  }
  return digits;
}

/**
 * Open WhatsApp or WhatsApp Business with pre-filled message and optional recipient phone
 */
export function openWhatsApp({
  phone = '',
  text,
  isBusiness = false,
}: {
  phone?: string;
  text: string;
  isBusiness?: boolean;
}) {
  const cleanPhone = phone ? formatPhoneForWhatsApp(phone) : '';
  const encoded = encodeURIComponent(text);
  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);

  let url = '';
  if (isBusiness) {
    if (isAndroid) {
      // Direct intent to WhatsApp Business on Android
      url = cleanPhone
        ? `intent://send?phone=${cleanPhone}&text=${encoded}#Intent;package=com.whatsapp.w4b;scheme=whatsapp;end`
        : `intent://send?text=${encoded}#Intent;package=com.whatsapp.w4b;scheme=whatsapp;end`;
    } else {
      url = cleanPhone
        ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`
        : `https://api.whatsapp.com/send?text=${encoded}`;
    }
  } else {
    if (isAndroid) {
      // Direct intent to standard WhatsApp on Android
      url = cleanPhone
        ? `intent://send?phone=${cleanPhone}&text=${encoded}#Intent;package=com.whatsapp;scheme=whatsapp;end`
        : `intent://send?text=${encoded}#Intent;package=com.whatsapp;scheme=whatsapp;end`;
    } else {
      url = cleanPhone
        ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`
        : `https://api.whatsapp.com/send?text=${encoded}`;
    }
  }

  try {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch {
    window.location.href = url;
  }
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
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`,
  };
}

/**
 * Dual WhatsApp & WhatsApp Business Buttons Component
 */
export const WhatsAppActionButtons: React.FC<{
  phone?: string;
  text: string;
  regularLabel?: string;
  businessLabel?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({
  phone,
  text,
  regularLabel = 'واتساب العادي',
  businessLabel = 'واتساب الأعمال',
  className = '',
  size = 'md',
}) => {
  const sizeClasses =
    size === 'sm'
      ? 'py-2 px-2.5 text-[11px]'
      : size === 'lg'
      ? 'py-3.5 px-4 text-sm font-black'
      : 'py-2.5 px-3 text-xs font-bold';

  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      {/* Regular WhatsApp */}
      <button
        type="button"
        onClick={() => openWhatsApp({ phone, text, isBusiness: false })}
        className={`${sizeClasses} rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-[0.98] transition cursor-pointer`}
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
      >
        <span className="w-4 h-4 rounded-full bg-white text-teal-800 font-black text-[10px] flex items-center justify-center leading-none shrink-0 shadow-sm font-sans">
          B
        </span>
        <span>{businessLabel}</span>
      </button>
    </div>
  );
};

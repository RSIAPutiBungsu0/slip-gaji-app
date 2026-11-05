'use client';

import React from 'react';
import { EmployeeRecord } from '@/app/types/employee';
import { getWhatsAppSendUrl } from '@/app/lib/utils';

interface WhatsAppSendLinkProps {
  employee: EmployeeRecord;
  className: string;
  children: React.ReactNode;
  title?: string;
  ariaLabel?: string;
}

export const WhatsAppSendLink: React.FC<WhatsAppSendLinkProps> = ({
  employee,
  className,
  children,
  title,
  ariaLabel
}) => {
  const sendUrl = getWhatsAppSendUrl(employee.nomorWhatsapp);

  if (!sendUrl) {
    return (
      <button
        type="button"
        disabled
        title="Nomor WhatsApp tidak valid"
        aria-label="Nomor WhatsApp tidak valid"
        className="cursor-not-allowed text-slate-400"
      >
        {children}
      </button>
    );
  }

  return (
    <a
      href={sendUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      title={title || 'Buka chat di WhatsApp Desktop'}
      className={className}
    >
      {children}
    </a>
  );
};

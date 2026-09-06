import React from 'react';

const LABELS = {
  AVAILABLE: 'Available',
  LOW_STOCK: 'Low Stock',
  OUT_OF_STOCK: 'Out of Stock',
};

const CLASSES = {
  AVAILABLE: 'badge badge-available',
  LOW_STOCK: 'badge badge-low',
  OUT_OF_STOCK: 'badge badge-out',
};

export default function StatusBadge({ status }) {
  return <span className={CLASSES[status] || 'badge'}>{LABELS[status] || status}</span>;
}

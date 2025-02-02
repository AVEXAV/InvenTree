import { t } from '@lingui/macro';
import { ReactNode } from 'react';

import { RenderInlineModel } from './Instance';

/**
 * Inline rendering of a single PurchaseOrder instance
 */
export function RenderPurchaseOrder({
  instance
}: {
  instance: any;
}): ReactNode {
  let supplier = instance.supplier_detail || {};

  // TODO: Handle URL
  return (
    <RenderInlineModel
      primary={instance.reference}
      secondary={instance.description}
      image={supplier.thumnbnail || supplier.image}
    />
  );
}

/**
 * Inline rendering of a single ReturnOrder instance
 */
export function RenderReturnOrder({ instance }: { instance: any }): ReactNode {
  let customer = instance.customer_detail || {};

  return (
    <RenderInlineModel
      primary={instance.reference}
      secondary={instance.description}
      image={customer.thumnbnail || customer.image}
    />
  );
}

/**
 * Inline rendering of a single SalesOrder instance
 */
export function RenderSalesOrder({ instance }: { instance: any }): ReactNode {
  let customer = instance.customer_detail || {};

  // TODO: Handle URL

  return (
    <RenderInlineModel
      primary={instance.reference}
      secondary={instance.description}
      image={customer.thumnbnail || customer.image}
    />
  );
}

/**
 * Inline rendering of a single SalesOrderAllocation instance
 */
export function RenderSalesOrderShipment({
  instance
}: {
  instance: any;
}): ReactNode {
  let order = instance.sales_order_detail || {};

  return (
    <RenderInlineModel
      primary={order.reference}
      secondary={t`Shipment` + ` ${instance.description}`}
    />
  );
}

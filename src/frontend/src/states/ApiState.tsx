import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { api } from '../App';
import { ModelType } from '../components/render/ModelType';
import { StatusCodeListInterface } from '../components/renderers/StatusRenderer';
import { statusCodeList } from '../defaults/backendMappings';
import { emptyServerAPI } from '../defaults/defaults';
import { ServerAPIProps } from './states';

type StatusLookup = Record<ModelType, StatusCodeListInterface>;

interface ServerApiStateProps {
  server: ServerAPIProps;
  setServer: (newServer: ServerAPIProps) => void;
  fetchServerApiState: () => void;
  status: StatusLookup | undefined;
}

export const useServerApiState = create<ServerApiStateProps>()(
  persist(
    (set) => ({
      server: emptyServerAPI,
      setServer: (newServer: ServerAPIProps) => set({ server: newServer }),
      fetchServerApiState: async () => {
        // Fetch server data
        await api
          .get(apiUrl(ApiPaths.api_server_info))
          .then((response) => {
            set({ server: response.data });
          })
          .catch(() => {});
        // Fetch status data for rendering labels
        await api.get(apiUrl(ApiPaths.global_status)).then((response) => {
          const newStatusLookup: StatusLookup = {} as StatusLookup;
          for (const key in response.data) {
            newStatusLookup[statusCodeList[key]] = response.data[key].values;
          }
          set({ status: newStatusLookup });
        });
      },
      status: undefined
    }),
    {
      name: 'server-api-state',
      getStorage: () => sessionStorage
    }
  )
);

export enum ApiPaths {
  api_server_info = 'api-server-info',

  api_search = 'api-search',

  // User information
  user_me = 'api-user-me',
  user_roles = 'api-user-roles',
  user_token = 'api-user-token',
  user_simple_login = 'api-user-simple-login',
  user_reset = 'api-user-reset',
  user_reset_set = 'api-user-reset-set',
  user_sso = 'api-user-sso',
  user_sso_remove = 'api-user-sso-remove',
  user_emails = 'api-user-emails',
  user_email_verify = 'api-user-email-verify',
  user_email_primary = 'api-user-email-primary',
  user_email_remove = 'api-user-email-remove',

  settings_global_list = 'api-settings-global-list',
  settings_user_list = 'api-settings-user-list',
  notifications_list = 'api-notifications-list',

  currency_list = 'api-currency-list',
  currency_refresh = 'api-currency-refresh',

  barcode = 'api-barcode',
  news = 'news',
  global_status = 'api-global-status',
  version = 'api-version',
  sso_providers = 'api-sso-providers',

  // Build order URLs
  build_order_list = 'api-build-list',
  build_order_attachment_list = 'api-build-attachment-list',

  // BOM URLs
  bom_list = 'api-bom-list',

  // Part URLs
  part_list = 'api-part-list',
  category_list = 'api-category-list',
  category_tree = 'api-category-tree',
  related_part_list = 'api-related-part-list',
  part_attachment_list = 'api-part-attachment-list',
  part_parameter_list = 'api-part-parameter-list',
  part_parameter_template_list = 'api-part-parameter-template-list',

  // Company URLs
  company_list = 'api-company-list',
  company_attachment_list = 'api-company-attachment-list',
  supplier_part_list = 'api-supplier-part-list',
  manufacturer_part_list = 'api-manufacturer-part-list',

  // Stock Item URLs
  stock_item_list = 'api-stock-item-list',
  stock_tracking_list = 'api-stock-tracking-list',
  stock_location_list = 'api-stock-location-list',
  stock_location_tree = 'api-stock-location-tree',
  stock_attachment_list = 'api-stock-attachment-list',

  // Purchase Order URLs
  purchase_order_list = 'api-purchase-order-list',
  purchase_order_line_list = 'api-purchase-order-line-list',
  purchase_order_attachment_list = 'api-purchase-order-attachment-list',

  // Sales Order URLs
  sales_order_list = 'api-sales-order-list',
  sales_order_attachment_list = 'api-sales-order-attachment-list',

  // Return Order URLs
  return_order_list = 'api-return-order-list',
  return_order_attachment_list = 'api-return-order-attachment-list',

  // Plugin URLs
  plugin_list = 'api-plugin-list',

  project_code_list = 'api-project-code-list',
  custom_unit_list = 'api-custom-unit-list'
}

/**
 * Function to return the API prefix.
 * For now it is fixed, but may be configurable in the future.
 */
export function apiPrefix(): string {
  return '/api/';
}

/**
 * Return the endpoint associated with a given API path
 */
export function apiEndpoint(path: ApiPaths): string {
  switch (path) {
    case ApiPaths.api_server_info:
      return '';
    case ApiPaths.user_me:
      return 'user/me/';
    case ApiPaths.user_roles:
      return 'user/roles/';
    case ApiPaths.user_token:
      return 'user/token/';
    case ApiPaths.user_simple_login:
      return 'email/generate/';
    case ApiPaths.user_reset:
      // Note leading prefix here
      return 'auth/password/reset/';
    case ApiPaths.user_reset_set:
      // Note leading prefix here
      return 'auth/password/reset/confirm/';
    case ApiPaths.user_sso:
      return 'auth/social/';
    case ApiPaths.user_sso_remove:
      return 'auth/social/$id/disconnect/';
    case ApiPaths.user_emails:
      return 'auth/emails/';
    case ApiPaths.user_email_remove:
      return 'auth/emails/$id/remove/';
    case ApiPaths.user_email_verify:
      return 'auth/emails/$id/verify/';
    case ApiPaths.user_email_primary:
      return 'auth/emails/$id/primary/';
    case ApiPaths.currency_list:
      return 'currency/exchange/';
    case ApiPaths.currency_refresh:
      return 'currency/refresh/';
    case ApiPaths.api_search:
      return 'search/';
    case ApiPaths.settings_global_list:
      return 'settings/global/';
    case ApiPaths.settings_user_list:
      return 'settings/user/';
    case ApiPaths.notifications_list:
      return 'notifications/';
    case ApiPaths.barcode:
      return 'barcode/';
    case ApiPaths.news:
      return 'news/';
    case ApiPaths.global_status:
      return 'generic/status/';
    case ApiPaths.version:
      return 'version/';
    case ApiPaths.sso_providers:
      return 'auth/providers/';
    case ApiPaths.build_order_list:
      return 'build/';
    case ApiPaths.build_order_attachment_list:
      return 'build/attachment/';
    case ApiPaths.bom_list:
      return 'bom/';
    case ApiPaths.part_list:
      return 'part/';
    case ApiPaths.part_parameter_list:
      return 'part/parameter/';
    case ApiPaths.part_parameter_template_list:
      return 'part/parameter/template/';
    case ApiPaths.category_list:
      return 'part/category/';
    case ApiPaths.category_tree:
      return 'part/category/tree/';
    case ApiPaths.related_part_list:
      return 'part/related/';
    case ApiPaths.part_attachment_list:
      return 'part/attachment/';
    case ApiPaths.company_list:
      return 'company/';
    case ApiPaths.company_attachment_list:
      return 'company/attachment/';
    case ApiPaths.supplier_part_list:
      return 'company/part/';
    case ApiPaths.manufacturer_part_list:
      return 'company/part/manufacturer/';
    case ApiPaths.stock_item_list:
      return 'stock/';
    case ApiPaths.stock_tracking_list:
      return 'stock/track/';
    case ApiPaths.stock_location_list:
      return 'stock/location/';
    case ApiPaths.stock_location_tree:
      return 'stock/location/tree/';
    case ApiPaths.stock_attachment_list:
      return 'stock/attachment/';
    case ApiPaths.purchase_order_list:
      return 'order/po/';
    case ApiPaths.purchase_order_line_list:
      return 'order/po-line/';
    case ApiPaths.purchase_order_attachment_list:
      return 'order/po/attachment/';
    case ApiPaths.sales_order_list:
      return 'order/so/';
    case ApiPaths.sales_order_attachment_list:
      return 'order/so/attachment/';
    case ApiPaths.return_order_list:
      return 'order/ro/';
    case ApiPaths.return_order_attachment_list:
      return 'order/ro/attachment/';
    case ApiPaths.plugin_list:
      return 'plugins/';
    case ApiPaths.project_code_list:
      return 'project-code/';
    case ApiPaths.custom_unit_list:
      return 'units/';
    default:
      return '';
  }
}

/**
 * Construct an API URL with an endpoint and (optional) pk value
 */
export function apiUrl(path: ApiPaths, pk?: any): string {
  let _url = apiEndpoint(path);

  // If the URL does not start with a '/', add the API prefix
  if (!_url.startsWith('/')) {
    _url = apiPrefix() + _url;
  }

  if (_url && pk) {
    _url += `${pk}/`;
  }

  return _url;
}

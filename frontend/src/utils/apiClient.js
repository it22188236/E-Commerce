import axios from "axios";

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT on every request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Auto-logout on 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("auth-error"));
    }
    return Promise.reject(error);
  },
);

export default apiClient;

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------
const unwrap = (response) => response?.data?.data ?? response?.data;

// ---------------------------------------------------------------------------
// AUTH  –  auth-service:5001  →  /api/auth/*
// ---------------------------------------------------------------------------
export const authService = {
  /** POST /api/auth/login */
  login: async (credentials) => {
    const response = await apiClient.post("/auth/login", credentials);
    const payload = unwrap(response);
    return { data: { token: payload?.token, user: payload?.user } };
  },

  /** POST /api/auth/register */
  register: async (userData) => {
    const response = await apiClient.post("/auth/register", {
      name: userData.name,
      email: userData.email,
      password: userData.password,
    });
    const payload = unwrap(response);
    return { data: { token: payload?.token, user: payload?.user } };
  },

  /** GET /api/auth/profile  (requires auth token) */
  getProfile: async () => {
    const response = await apiClient.get("/auth/profile");
    const payload = unwrap(response);
    return { data: { user: payload?.user ?? payload } };
  },
};

// ---------------------------------------------------------------------------
// PRODUCTS  –  product-service:5002  →  /api/products/*
// ---------------------------------------------------------------------------
const PRODUCTS_ENDPOINT = import.meta.env.VITE_PRODUCTS_ENDPOINT || "/products";

const normalizeProduct = (product) => {
  if (!product) return product;
  const primaryImage =
    product.image ??
    product.imageUrl ??
    product.thumbnail ??
    (Array.isArray(product.images) ? product.images[0]?.url : "") ??
    "";
  return {
    ...product,
    id: product.id ?? product._id ?? product.productId,
    name: product.name ?? product.title ?? "",
    category: product.category ?? "Uncategorized",
    description: product.description ?? "",
    image: primaryImage,
    price: Number(product.price ?? 0),
    stock: Number(product.stock ?? product.quantity ?? 0),
  };
};

const normalizeProductList = (payload) =>
  Array.isArray(payload) ? payload.map(normalizeProduct) : [];

const buildProductPayload = (d) => ({
  name: d.name?.trim(),
  category: d.category?.trim().toLowerCase(),
  description: d.description?.trim(),
  images: d.image
    ? [{ url: d.image, alt: d.name?.trim() || "Product image" }]
    : [],
  price: Number(d.price ?? 0),
  stock: Number(d.stock ?? 0),
});

export const productService = {
  /** GET /api/products  (public) */
  getProducts: async () => {
    const response = await apiClient.get(PRODUCTS_ENDPOINT);
    return { data: normalizeProductList(unwrap(response)) };
  },

  /** GET /api/products/:id  (public) */
  getProductById: async (id) => {
    const response = await apiClient.get(`${PRODUCTS_ENDPOINT}/${id}`);
    return { data: normalizeProduct(unwrap(response)) };
  },

  /** POST /api/products  (admin) */
  createProduct: async (productData) => {
    const response = await apiClient.post(
      PRODUCTS_ENDPOINT,
      buildProductPayload(productData),
    );
    return { data: normalizeProduct(unwrap(response)) };
  },

  /** PUT /api/products/:id  (admin) */
  updateProduct: async (id, productData) => {
    const response = await apiClient.put(
      `${PRODUCTS_ENDPOINT}/${id}`,
      buildProductPayload(productData),
    );
    return { data: normalizeProduct(unwrap(response)) };
  },

  /** DELETE /api/products/:id  (admin) */
  deleteProduct: async (id) => {
    const response = await apiClient.delete(`${PRODUCTS_ENDPOINT}/${id}`);
    return { data: unwrap(response) ?? { id } };
  },
};

// ---------------------------------------------------------------------------
// ORDERS  –  order-service:5003  →  /api/orders/*
// ---------------------------------------------------------------------------
const ORDERS_ENDPOINT = "/orders";

const toTitleCase = (v = "") =>
  v.length > 0 ? v.charAt(0).toUpperCase() + v.slice(1) : v;

const normalizeOrder = (order) => ({
  id: order?._id ?? order?.id ?? order?.orderNumber,
  date: order?.createdAt ?? order?.date ?? new Date().toISOString(),
  total: Number(order?.totalAmount ?? order?.total ?? 0),
  status: toTitleCase(order?.orderStatus ?? order?.status ?? "pending"),
  user: {
    userId: order?.user?.userId ?? order?.userId ?? null,
    name: order?.user?.name ?? order?.customerName ?? "Unknown User",
    email: order?.user?.email ?? order?.customerEmail ?? "",
  },
  items: Array.isArray(order?.items)
    ? order.items.map((item) => ({
        name: item?.productName ?? item?.name ?? "Item",
        quantity: Number(item?.quantity ?? 1),
        price: Number(item?.price ?? 0),
      }))
    : [],
});

const normalizeOrders = (payload) =>
  Array.isArray(payload) ? payload.map(normalizeOrder) : [];

const buildOrderPayload = (orderData) => ({
  items: Array.isArray(orderData?.items)
    ? orderData.items.map((item) => ({
        productId: item.productId ?? item.id,
        quantity: Number(item.quantity ?? 1),
      }))
    : [],
  shippingAddress: {
    street: orderData?.shippingAddress?.street ?? "",
    city: orderData?.shippingAddress?.city ?? "",
    state: orderData?.shippingAddress?.state ?? "N/A",
    zipCode: orderData?.shippingAddress?.zipCode ?? "",
    country: orderData?.shippingAddress?.country ?? "N/A",
  },
  paymentMethod: orderData?.paymentMethod ?? "card",
  customer: {
    firstName: orderData?.customer?.firstName ?? "",
    lastName: orderData?.customer?.lastName ?? "",
    email: orderData?.customer?.email ?? "",
    phone: orderData?.customer?.phone ?? "",
    address: orderData?.customer?.address ?? "",
    city: orderData?.customer?.city ?? "",
    country: orderData?.customer?.country ?? "Sri Lanka",
  },
});

export const orderService = {
  /** GET /api/orders  (user sees own; admin sees all) */
  getOrders: async () => {
    const response = await apiClient.get(ORDERS_ENDPOINT);
    return { data: normalizeOrders(response?.data?.data) };
  },

  /** GET /api/orders/:id  (auth) */
  getOrderById: async (orderId) => {
    const response = await apiClient.get(`${ORDERS_ENDPOINT}/${orderId}`);
    return { data: normalizeOrder(response?.data?.data) };
  },

  /** POST /api/orders  (auth) */
  createOrder: async (orderData) => {
    const response = await apiClient.post(
      ORDERS_ENDPOINT,
      buildOrderPayload(orderData),
    );
    const created = response?.data?.data?.order ?? response?.data?.data;
    const payment =
      response?.data?.data?.payment?.data ?? response?.data?.data?.payment;
    return {
      data: {
        order: normalizeOrder(created),
        payment,
      },
    };
  },

  /** PUT /api/orders/:id  (admin) */
  updateOrderStatus: async (orderId, status) => {
    const response = await apiClient.put(`${ORDERS_ENDPOINT}/${orderId}`, {
      orderStatus: status.toLowerCase(),
    });
    const updated = response?.data?.data?.order ?? response?.data?.data;
    return { data: normalizeOrder(updated) };
  },
};

// ---------------------------------------------------------------------------
// PAYMENTS  –  payment-service:5004  →  /api/payments/*
// ---------------------------------------------------------------------------
const PAYMENTS_ENDPOINT = "/payments";

export const paymentService = {
  /** POST /api/payments/process  (auth) */
  processPayment: async (payload) => {
    const response = await apiClient.post(
      `${PAYMENTS_ENDPOINT}/process`,
      payload,
    );
    return { data: response?.data?.data ?? response?.data };
  },

  getPayPalConfig: async () => {
    const response = await apiClient.get(`${PAYMENTS_ENDPOINT}/paypal/config`);
    return { data: response?.data?.data ?? response?.data };
  },

  createPayPalOrder: async (payload) => {
    const response = await apiClient.post(
      `${PAYMENTS_ENDPOINT}/orders`,
      payload,
    );
    return { data: response?.data?.data ?? response?.data };
  },

  capturePayPalOrder: async (orderId, payload) => {
    const response = await apiClient.post(
      `${PAYMENTS_ENDPOINT}/orders/${orderId}/capture`,
      payload,
    );
    return { data: response?.data?.data ?? response?.data };
  },

  /** GET /api/payments/:paymentId  (auth) */
  getPaymentDetails: async (paymentId) => {
    const response = await apiClient.get(`${PAYMENTS_ENDPOINT}/${paymentId}`);
    return { data: response?.data?.data ?? response?.data };
  },
};

// ---------------------------------------------------------------------------
// NOTIFICATIONS  –  payment-service:5004  →  /api/notifications/*
// ---------------------------------------------------------------------------
const NOTIFICATIONS_ENDPOINT = "/notifications";

const normalizeNotification = (n) => ({
  id: n?._id ?? n?.id,
  type: n?.type ?? "",
  subject: n?.subject ?? "",
  status: n?.status ?? "sent",
  sentAt: n?.sentAt ?? n?.createdAt ?? new Date().toISOString(),
});

export const notificationService = {
  /** GET /api/notifications  (auth) */
  getUserNotifications: async () => {
    const response = await apiClient.get(NOTIFICATIONS_ENDPOINT);
    const data = response?.data?.data;
    return { data: Array.isArray(data) ? data.map(normalizeNotification) : [] };
  },

  /** POST /api/notifications/send  (auth) */
  sendNotification: async (payload) => {
    const response = await apiClient.post(
      `${NOTIFICATIONS_ENDPOINT}/send`,
      payload,
    );
    return { data: response?.data?.data ?? response?.data };
  },
};

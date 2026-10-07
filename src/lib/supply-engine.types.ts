export type SupplyGroup = {
  id: string;
  name: string;
  slug: string;
};

export type SupplySpare = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: number;
  priceWas: number | null;
  image: string;
  thumbnail: string;
  images: string[];
  thumbnails: string[];
  stockLevel: number;
  brand: string;
  groupIds: string[];
};

export type SparesShop = {
  groups: SupplyGroup[];
  products: SupplySpare[];
  error: string | null;
};

export type LiveStockist = {
  id: string;
  name: string;
  address: string;
  town: string;
  county: string;
  postcode: string;
  phone: string;
  website: string;
  openingTimes: { day: string; hours: string }[];
};

export type StockistFeed = {
  stockists: LiveStockist[];
  error: string | null;
};

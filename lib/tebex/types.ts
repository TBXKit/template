export interface Webstore {
  id: number;
  name: string;
  description: string;
  currency: string;
  lang: string;
  logo: string | null;
}

export interface BaseItem {
  id: number;
  name: string;
}

export type PackageType = "subscription" | "single";

export interface Package extends BaseItem {
  description: string;
  type: PackageType;
  base_price: number;
  total_price: number;
  image: string | null;
  category: BaseItem;
}

export interface Category extends BaseItem {
  description: string;
  packages: Package[];
}

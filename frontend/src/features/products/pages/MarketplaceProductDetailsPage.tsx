import { getApiErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import { AddToCartButton } from "@/features/cart/components/AddToCartButton";
import { getProduct, productImageUrl } from "@/features/products/api/products.api";
import type { Product } from "@/features/products/types/product.types";
import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import "./marketplace-product-details.css";

type DetailsState =
  | { status: "loading" }
  | { status: "loaded"; product: Product }
  | { status: "not-found" }
  | { status: "error"; message: string };

function DetailsSkeleton() {
  return <div className="marketplace-details-skeleton" aria-label="Loading product details" aria-busy="true"><div className="details-skeleton-image" /><div className="details-skeleton-copy"><div /><div /><div /><div /><div /></div></div>;
}

export default function MarketplaceProductDetailsPage() {
  const { id: rawId } = useParams();
  const location = useLocation();
  const numericId = Number(rawId);
  const validId = Number.isInteger(numericId) && numericId > 0;
  const [state, setState] = useState<DetailsState>({ status: "loading" });
  const [retry, setRetry] = useState(0);
  const backTo = typeof location.state?.from === "string" && location.state.from.startsWith("/products")
    ? location.state.from
    : "/products";

  useEffect(() => {
    if (!validId) {
      setState({ status: "not-found" });
      return;
    }
    const controller = new AbortController();
    setState({ status: "loading" });
    getProduct(numericId, controller.signal)
      .then((product) => { if (!controller.signal.aborted) setState({ status: "loaded", product }); })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        if (axios.isAxiosError(reason) && reason.response?.status === 404) {
          setState({ status: "not-found" });
        } else {
          setState({ status: "error", message: getApiErrorMessage(reason) });
        }
      });
    return () => controller.abort();
  }, [numericId, validId, retry]);

  return <div className="marketplace-product-details">
    <Link className="marketplace-details-back" to={backTo}><span aria-hidden="true">←</span> Back to products</Link>
    {state.status === "loading" ? <DetailsSkeleton /> : state.status === "not-found" ? <section className="marketplace-details-message"><span className="marketplace-details-message-mark">W</span><p className="marketplace-details-eyebrow">PRODUCT UNAVAILABLE</p><h1>We couldn’t find that product.</h1><p>It may have been removed, is no longer available, or the link is incorrect.</p><Button nativeButton={false} render={<Link to="/products" />}>Browse products</Button></section> : state.status === "error" ? <section className="marketplace-details-message marketplace-details-error"><span className="marketplace-details-message-mark">!</span><p className="marketplace-details-eyebrow">SOMETHING WENT WRONG</p><h1>Product details didn’t load.</h1><p role="alert">{state.message}</p><Button onClick={() => setRetry((value) => value + 1)}>Try again</Button></section> : <ProductDetails product={state.product} />}
  </div>;
}

function ProductDetails({ product }: { product: Product }) {
  const image = productImageUrl(product.imageUrl);
  const available = product.stock > 0;
  const formattedPrice = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(product.price));
  return <article className="marketplace-product-detail-card">
    <div className="marketplace-detail-image-wrap">
      {image ? <img className="marketplace-detail-image" src={image} alt={product.name} /> : <div className="marketplace-detail-image-placeholder" aria-label="No product image"><span>Watermelon</span></div>}
      <span className={`marketplace-detail-availability ${available ? "available" : "unavailable"}`}><span />{available ? "In stock" : "Out of stock"}</span>
    </div>
    <div className="marketplace-detail-copy">
      <p className="marketplace-details-eyebrow">{product.category.name}</p>
      <h1>{product.name}</h1>
      <p className="marketplace-detail-price">{formattedPrice}</p>
      <AddToCartButton productId={product.id} stock={product.stock} className="marketplace-detail-add-cart" />
      <div className="marketplace-detail-divider" />
      <h2>Product details</h2>
      <p className="marketplace-detail-description">{product.description?.trim() || "No product description has been provided."}</p>
      <dl className="marketplace-detail-facts">
        <div><dt>Category</dt><dd><Link to={`/products?category=${product.category.id}`}>{product.category.name}</Link></dd></div>
        <div><dt>Availability</dt><dd className={available ? "stock-available" : "stock-unavailable"}>{available ? "Available" : "Currently unavailable"}</dd></div>
        {available && <div><dt>Stock</dt><dd>{product.stock} {product.stock === 1 ? "unit" : "units"}</dd></div>}
        <div><dt>Supplier</dt><dd>{product.supplier.name}</dd></div>
      </dl>
    </div>
  </article>;
}

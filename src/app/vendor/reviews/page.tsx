/* eslint-disable react-hooks/error-boundaries -- awaited API failures render the vendor data fallback */
import { MessageSquareText, Star } from "lucide-react";
import { VendorDataError } from "@/app/vendor/page";
import { ReviewResponseForm } from "@/components/vendor-forms";
import { getVendorReviews } from "@/lib/vendor-api";

export default async function VendorReviewsPage() {
  try {
    const { reviews } = await getVendorReviews();
    const average = reviews.length
      ? reviews.reduce((sum, review) => sum + Number(review.rating), 0) /
        reviews.length
      : 0;
    return (
      <div className="vendor-page">
        <header className="vendor-page-heading">
          <div>
            <p className="eyebrow">Customer feedback</p>
            <h1>Reviews</h1>
            <p>
              Learn from customer feedback and publish a thoughtful business
              response.
            </p>
          </div>
          <div className="vendor-rating-summary">
            <Star size={22} fill="currentColor" />
            <strong>{average.toFixed(1)}</strong>
            <span>{reviews.length} reviews</span>
          </div>
        </header>
        <div className="vendor-review-grid">
          {reviews.map((review) => (
            <article className="vendor-review-card" key={review.id}>
              <div className="vendor-review-heading">
                <div>
                  <strong>
                    {review.users?.name || "StreetPlate customer"}
                  </strong>
                  <small>
                    {new Date(review.created_at).toLocaleDateString("en-ZA")}
                  </small>
                </div>
                <span>
                  <Star size={16} fill="currentColor" />
                  {review.rating}
                </span>
              </div>
              <p>
                {review.comment ||
                  "The customer left a rating without a written comment."}
              </p>
              <ReviewResponseForm review={review} />
            </article>
          ))}
        </div>
        {!reviews.length && (
          <div className="vendor-empty-state vendor-empty-wide">
            <MessageSquareText size={30} />
            <strong>No reviews yet</strong>
            <p>Customer feedback from delivered orders will appear here.</p>
          </div>
        )}
      </div>
    );
  } catch (error) {
    return <VendorDataError error={error} />;
  }
}

// Widget embed — same booking flow with minimal chrome for iframe use
// Redirects to the main booking page (parent handles the layout via CSS)
import { redirect } from 'next/navigation'

export default function BookingWidget({ params }: { params: { slug: string } }) {
  // In production you'd render an iframe-optimized version.
  // For now, redirect to the full booking page.
  redirect(`/book/${params.slug}`)
}

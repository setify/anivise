import { Navbar } from '@/components/marketing/navbar'
import { Footer } from '@/components/marketing/footer'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen scroll-smooth bg-white">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  )
}

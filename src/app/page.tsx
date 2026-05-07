import Link from "next/link";
import { Header } from "../frontend/components/layout/Header/Header";
import { Button, Badge } from "../frontend/components";
import { Package, BarChart3, Calendar, ArrowRight, ShieldCheck } from "lucide-react";
import styles from "./page.module.css";

const sellerTools = [
  {
    title: "Inventory Suite",
    description: "Full control over your digital and physical stock with precise tracking.",
    badge: "Management",
    image: "https://images.unsplash.com/photo-1545241047-6083a3684587?q=80&w=600&h=800&auto=format&fit=crop", 
    status: "Active Tool",
    icon: Package,
  },
  {
    title: "Revenue Analytics",
    description: "Deep dive into your sales performance with organic growth insights.",
    badge: "Analytics",
    image: "https://plantsandplants.store/cdn/shop/files/20230919_140340_1024x1024.jpg?v=1723174473",
    status: "Pro Version",
    icon: BarChart3,
  },
  {
    title: "Service Planner",
    description: "Coordinate bookings and appointments through an elegant interface.",
    badge: "Schedule",
    image: "https://roseandammiflowers.com/cdn/shop/products/image_1aa64b8b-d7d8-4ffe-a587-1a1015b20f03_grande.jpg?v=1589920240",
    status: "Essential",
    icon: Calendar,
  },
];

export default function HomePage() {
  return (
    <div className={styles.page}>
      <Header 
        actions={
          <>
            <Link href="/sign-in"><Button variant="ghost">Seller Login</Button></Link>
            <Link href="/sign-up"><Button variant="primary">Start Selling</Button></Link>
          </>
        }
      />

      <main className={styles.main}>
        {/* HERO SECTION - Enfocado en el Vendedor */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <h1 className={styles.heroTitle}>
              Seller <span className={styles.italic}>Dashboard</span>
            </h1>
            <p className={styles.heroSubtitle}>
              The premium ecosystem for modern botanical merchants. 
              Manage your business with architectural precision and grow your brand organically.
            </p>
            <div className={styles.filterBar}>
              <Badge variant="primary">Seller Central</Badge>
              <Badge>Merchant Tools</Badge>
              <Badge>Performance</Badge>
              <Badge>Market Insights</Badge>
            </div>
          </div>
        </section>

        {/* SELLER TOOLS GRID */}
        <section className={styles.gridSection}>
          <div className={styles.featuresGrid}>
            {sellerTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <div key={tool.title} className={styles.featureWrapper}>
                  <div className={styles.imageContainer}>
                    <img src={tool.image} alt={tool.title} className={styles.featureImage} />
                    <div className={styles.imageOverlay}>
                      <Button variant="primary" className={styles.quickAdd}>
                        Configure Tool +
                      </Button>
                    </div>
                  </div>
                  <div className={styles.featureInfo}>
                    <div className={styles.featureHeader}>
                      <div className={styles.iconWrapper}>
                        <Icon size={14} />
                      </div>
                      <span className={styles.featureBadgeText}>{tool.badge}</span>
                      <span className={styles.featureStatus}>{tool.status}</span>
                    </div>
                    <h3 className={styles.featureTitle}>{tool.title}</h3>
                    <p className={styles.featureDesc}>{tool.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* BOTTOM CTA SECTION */}
        <section className={styles.discoverMore}>
          <div className={styles.line}></div>
          <Link href="/sign-up" className={styles.discoverLink}>
            Open your Seller Account <ArrowRight size={14} />
          </Link>
          <div className={styles.line}></div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerBottom}>
          <p>© {new Date().getFullYear()} Bonzai Seller App</p>
          <p>Secure Merchant Environment <ShieldCheck size={10} /></p>
        </div>
      </footer>
    </div>
  );
}
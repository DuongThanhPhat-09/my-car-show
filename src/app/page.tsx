import { CAR_SPECS, SITE } from "@/config/site";
import { FOCUS_POINTS } from "@/features/car/config/car.config";
import { MODEL_CODE, MODEL_NAME, PAINTS } from "@/features/configurator/options";
import { ShowroomExperience } from "@/features/experience/ShowroomExperience";

/**
 * Server component. Ships crawlable, semantic content (specs, highlights,
 * structured data) in the initial HTML; the WebGL experience hydrates on top.
 */
export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Car",
    name: `Lamborghini ${MODEL_NAME}`,
    brand: { "@type": "Brand", name: "Lamborghini" },
    description: SITE.description,
    vehicleConfiguration: MODEL_CODE,
    bodyType: "Coupé",
    fuelType: "Gasoline",
    vehicleEngine: { "@type": "EngineSpecification", name: "6.5 L V12" },
    color: PAINTS.map((p) => p.name).join(", "),
    additionalProperty: CAR_SPECS.map((s) => ({ "@type": "PropertyValue", name: s.label, value: s.value })),
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Indexable content – visually hidden, the 3D scene is the presentation layer. */}
      <article className="sr-only">
        <h1>Lamborghini Aventador S — 3D Showroom</h1>
        <p>{SITE.description}</p>
        <h2>Technical data</h2>
        <dl>
          {CAR_SPECS.map((s) => (
            <div key={s.label}>
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>
        <h2>Highlights</h2>
        <ul>
          {FOCUS_POINTS.map((f) => (
            <li key={f.id}>
              <h3>{f.title}</h3>
              <p>{f.description}</p>
            </li>
          ))}
        </ul>
        <h2>Exterior colours</h2>
        <ul>
          {PAINTS.map((p) => (
            <li key={p.id}>{p.name}</li>
          ))}
        </ul>
      </article>

      <ShowroomExperience />
    </main>
  );
}

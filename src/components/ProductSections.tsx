import { Link } from "@tanstack/react-router";
import { ProductContentSection } from "@/lib/catalog.types";
import { AutoPlayVideo } from "@/components/AutoPlayVideo";
import { CheckCircle2, Lightbulb } from "lucide-react";

type ItemLink = { to: "/product/$slug"; slug: string };
type ResolveItemLink = (item: { title: string }) => ItemLink | undefined;

const VIDEO_RE = /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i;

function VideoBlock({ sec }: { sec: ProductContentSection }) {
  return (
    <div className="w-full bg-black space-y-6 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2 text-center">
        {sec.heading && (
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{sec.heading}</h2>
        )}
        {sec.subheading && <p className="text-sm text-slate-300">{sec.subheading}</p>}
      </div>
      <div className="relative w-full aspect-video bg-black">
        {sec.video_url && VIDEO_RE.test(sec.video_url) ? (
          <AutoPlayVideo
            src={sec.video_url}
            title={sec.video_title || sec.heading || "Product Video"}
            className="absolute inset-0 w-full h-full object-contain bg-black"
          />
        ) : (
          <iframe
            src={sec.video_url}
            title={sec.video_title || sec.heading || "Product Video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        )}
      </div>
    </div>
  );
}

function FlowExamples({ sec }: { sec: ProductContentSection }) {
  return (
    <div className="space-y-8">
      <div className="max-w-3xl space-y-2">
        <h2 className="text-2xl font-extrabold text-slate-900">{sec.heading}</h2>
        {sec.subheading && (
          <p className="text-sm text-slate-600 leading-relaxed">{sec.subheading}</p>
        )}
      </div>
      {sec.video_url && (
        <div className="max-w-3xl mx-auto w-full">
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black">
            {VIDEO_RE.test(sec.video_url) ? (
              <AutoPlayVideo
                src={sec.video_url}
                title={sec.video_title || sec.heading || "Product Video"}
                className="absolute inset-0 w-full h-full object-contain bg-black"
              />
            ) : (
              <iframe
                src={sec.video_url}
                title={sec.video_title || sec.heading || "Product Video"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            )}
          </div>
        </div>
      )}
      {sec.items && sec.items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {sec.items.map((ex, i) => (
            <div key={i} className="space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-cyan-600" />
                {ex.title}
              </h3>
              {ex.description && (
                <p className="text-xs text-slate-600 leading-relaxed">{ex.description}</p>
              )}
              {ex.image_url && (
                <div className="flex justify-center">
                  <img src={ex.image_url} alt={ex.title} className="max-h-48 object-contain" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionHeading({ sec }: { sec: ProductContentSection }) {
  if (!sec.heading && !sec.subheading) return null;
  return (
    <div className="max-w-3xl space-y-2">
      {sec.heading && (
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{sec.heading}</h2>
      )}
      {sec.subheading && <p className="text-sm text-slate-600 leading-relaxed">{sec.subheading}</p>}
    </div>
  );
}

function Poster({ sec }: { sec: ProductContentSection }) {
  const end = sec.align === "end";
  const titleCard = (sec.heading || "").length < 28;
  return (
    <section
      className="relative !mt-0 !mb-0 flex min-h-[72vh] items-center bg-slate-900 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: sec.image_url ? `url("${sec.image_url}")` : undefined }}
    >
      <div className={`relative z-10 mx-auto w-full max-w-7xl px-6 py-16 sm:px-10 ${end ? "text-right" : ""}`}>
        {sec.heading &&
          (titleCard ? (
            <h2 className={`inline-block max-w-xl bg-white/60 px-4 py-2 ${end ? "ml-auto" : ""}`}>
              <span className="bg-gradient-to-r from-[#DB9C3D] to-[#C861EC] bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-5xl leading-[1.1]">
                {sec.heading}
              </span>
            </h2>
          ) : (
            <h2
              className={`inline-block max-w-xl px-4 py-3 text-3xl font-black tracking-tight text-white sm:text-4xl leading-[1.15] ${
                end ? "ml-auto" : ""
              }`}
              style={{
                background:
                  "linear-gradient(135deg, rgba(102,3,205,0.5) 0%, rgba(95,164,230,0.5) 45%, rgba(210,171,103,0.5) 100%)",
              }}
            >
              {sec.heading}
            </h2>
          ))}
      </div>
    </section>
  );
}

function AsideBand({ sec }: { sec: ProductContentSection }) {
  const items = sec.items || [];
  const textBesideImage = items.every((item) => !item.image_url);
  if (textBesideImage) {
    const copy = [sec.subheading, ...items.map((item) => item.description)].filter(
      (text, index, all) => text && all.indexOf(text) === index && text !== sec.heading,
    );
    return (
      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
        {sec.image_url && (
          <img src={sec.image_url} alt={sec.heading || ""} className="w-full h-auto object-contain" />
        )}
        <div className="space-y-4">
          {sec.heading && (
            <h2 className="text-2xl font-extrabold text-[#004E86] sm:text-3xl">{sec.heading}</h2>
          )}
          {copy.map((text) => (
            <p key={text} className="text-base leading-relaxed text-slate-600 sm:text-lg">
              {text}
            </p>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-5">
      <figure className="relative lg:col-span-3">
        {sec.image_url && (
          <img src={sec.image_url} alt={sec.heading || ""} className="w-full h-auto object-contain" />
        )}
        {sec.heading && (
          <h2 className="mt-4 text-2xl font-extrabold text-slate-950 sm:text-3xl">{sec.heading}</h2>
        )}
      </figure>
      <div className="space-y-6 lg:col-span-2">
        {(sec.items || []).map((item, index) => (
          <figure key={index} className="space-y-2">
            {item.image_url && (
              <img src={item.image_url} alt={item.title} className="w-full h-auto object-contain" />
            )}
            {item.title && <h3 className="text-lg font-extrabold text-slate-900">{item.title}</h3>}
            {item.description && (
              <p className="text-sm leading-relaxed text-slate-600">{item.description}</p>
            )}
          </figure>
        ))}
      </div>
    </div>
  );
}

function MediaFrame({ url, title }: { url: string; title?: string }) {
  return (
    <div className="relative w-full aspect-video bg-black overflow-hidden">
      {VIDEO_RE.test(url) ? (
        <AutoPlayVideo
          src={url}
          title={title || "Product Video"}
          className="absolute inset-0 w-full h-full object-contain bg-black"
        />
      ) : (
        <iframe
          src={url}
          title={title || "Product Video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      )}
    </div>
  );
}

/** Image beside copy, one row per item. Matches Maxspect's two-column feature rows. */
function SplitRows({
  sec,
  resolveItemLink,
}: {
  sec: ProductContentSection;
  resolveItemLink?: ResolveItemLink;
}) {
  const items = sec.items || [];
  if (sec.columns === 4 && items.length === 1 && items[0].image_url && !items[0].title) {
    return (
      <div className="grid grid-cols-1 items-end gap-8 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <SectionHeading sec={sec} />
        </div>
        <img
          src={items[0].image_url}
          alt={sec.heading || ""}
          className="mx-auto h-auto w-full max-w-[16rem] object-contain"
        />
      </div>
    );
  }
  return (
    <div className="space-y-12">
      {items.length === 0 && sec.video_url ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          <MediaFrame url={sec.video_url} title={sec.heading} />
          <SectionHeading sec={sec} />
        </div>
      ) : (
        <>
          <SectionHeading sec={sec} />
          {items.map((item, i) => {
            const link = item.title ? resolveItemLink?.(item) : undefined;
            const row = (
              <>
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.title || sec.heading || ""}
                    className="w-full h-auto object-contain"
                  />
                )}
                {(item.title || item.description) && (
                  <div className={item.description && item.description.length <= 80 ? "space-y-3" : "space-y-2"}>
                    {item.title && (
                      <h3
                        className={
                          item.description && item.description.length <= 80
                            ? "text-3xl sm:text-4xl font-black tracking-tight text-slate-950 leading-tight group-hover:text-cyan-700"
                            : "text-xl font-extrabold text-slate-900 group-hover:text-cyan-700"
                        }
                      >
                        {item.title}
                      </h3>
                    )}
                    {item.description && (
                      <p
                        className={
                          item.description.length <= 80
                            ? "text-lg sm:text-xl font-medium text-slate-500 leading-snug"
                            : "text-sm text-slate-600 leading-relaxed"
                        }
                      >
                        {item.description}
                      </p>
                    )}
                  </div>
                )}
              </>
            );
            if (!link) {
              return (
                <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
                  {row}
                </div>
              );
            }
            return (
              <Link
                key={i}
                to={link.to}
                params={{ slug: link.slug }}
                className="group grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center"
              >
                {row}
              </Link>
            );
          })}
        </>
      )}
    </div>
  );
}

/** Equal columns: 2×2 captions, or a row of images under a heading. */
function GridCards({
  sec,
  resolveItemLink,
}: {
  sec: ProductContentSection;
  resolveItemLink?: ResolveItemLink;
}) {
  const items = sec.items || [];
  const columns = sec.columns || (items.length >= 3 ? 3 : 2);
  const wordmarkRow =
    items.length >= 2 &&
    items.every((item) => item.image_url && !item.title && !item.description && /logo/i.test(item.image_url));
  const colClass =
    columns <= 1
      ? "grid-cols-1"
      : columns === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : columns === 4
          ? "grid-cols-2 lg:grid-cols-4"
          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  const solo = items.length === 1 ? items[0] : undefined;
  if (solo?.image_url && solo.title && !solo.description && columns <= 1 && !sec.heading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 text-center">
        <h2 className="text-2xl font-extrabold text-slate-950 sm:text-3xl">{solo.title}</h2>
        <img src={solo.image_url} alt={solo.title} className="w-full h-auto object-contain" />
      </div>
    );
  }
  return (
    <div className="space-y-8">
      <SectionHeading sec={sec} />
      {sec.image_url && (
        <img
          src={sec.image_url}
          alt={sec.heading || ""}
          className="w-full h-auto object-contain"
        />
      )}
      {items.length > 0 && (
        <div className={wordmarkRow ? "flex items-end justify-between gap-6" : `grid ${colClass} gap-8`}>
          {items.map((item, i) => {
            const link = item.title && !wordmarkRow ? resolveItemLink?.(item) : undefined;
            const card = (
              <figure className={wordmarkRow ? "min-w-0" : "space-y-3"}>
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.title || sec.heading || ""}
                    className={
                      wordmarkRow
                        ? "h-10 sm:h-12 w-auto max-w-full object-contain"
                        : "w-full h-auto object-contain"
                    }
                  />
                )}
                {(item.title || item.description) && (
                  <figcaption className="space-y-1">
                    {item.title && (
                      <h3 className="text-base font-extrabold text-slate-900 group-hover:text-cyan-700">
                        {item.title}
                      </h3>
                    )}
                    {item.description && (
                      <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                    )}
                  </figcaption>
                )}
              </figure>
            );
            if (!link) return <div key={i}>{card}</div>;
            return (
              <Link key={i} to={link.to} params={{ slug: link.slug }} className="group block">
                {card}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ProductSections({
  sections,
  className,
  resolveItemLink,
}: {
  sections: ProductContentSection[];
  className?: string;
  resolveItemLink?: ResolveItemLink;
}) {
  if (sections.length === 0) return null;
  const runs: { dark: boolean; items: ProductContentSection[] }[] = [];
  for (const sec of sections) {
    const dark = sec.surface === "dark";
    const last = runs[runs.length - 1];
    if (last?.dark === dark) last.items.push(sec);
    else runs.push({ dark, items: [sec] });
  }
  return (
    <section className={`pb-12 bg-white space-y-16 ${className ?? ""}`}>
      {runs.map((run) => (
        <div
          key={run.items[0]?.id}
          className={
            run.items.every((sec) => sec.layout === "poster")
              ? ""
              : run.dark
                ? "bg-black py-16 space-y-16 text-white [&_h2]:text-white [&_h3]:text-white [&_p]:text-slate-300 [&_figcaption]:text-slate-300"
                : "space-y-16"
          }
        >
          {run.items.map((sec, index) => {
        const isPending = sec.sync_status === "pending";
        const afterPosters = run.items[index - 1]?.layout === "poster" && sec.layout !== "poster";

        if (sec.layout === "poster" && sec.image_url) {
          return <Poster key={sec.id} sec={sec} />;
        }

        if (sec.type === "video_embed" && sec.video_url) {
          return <VideoBlock key={sec.id} sec={sec} />;
        }

        return (
          <div
            key={sec.id}
            className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${afterPosters ? "mt-20" : ""} ${
              isPending ? "relative ring-1 ring-amber-200 ring-inset rounded-2xl pt-10" : ""
            }`}
          >
            {isPending && (
              <span className="absolute top-3 right-4 z-10 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                Draft — pending approval
              </span>
            )}

            {sec.type === "feature_block" && sec.layout === "banner" && (
              <div>
                <section className="relative">
                  {sec.image_url && (
                    <img src={sec.image_url} alt={sec.heading || ""} className="w-full h-auto object-cover" />
                  )}
                  {sec.heading && (
                    <h2 className="absolute bottom-4 left-6 text-2xl font-extrabold text-white sm:bottom-6 sm:left-10 sm:text-3xl">
                      {sec.heading}
                    </h2>
                  )}
                </section>
                {sec.subheading && (
                  <p className="mx-auto max-w-4xl px-4 py-6 text-center text-base leading-relaxed text-slate-600 sm:text-lg">
                    {sec.subheading}
                  </p>
                )}
              </div>
            )}

            {sec.type === "feature_block" && sec.layout === "aside" && (
              <AsideBand sec={sec} />
            )}

            {sec.type === "feature_block" && sec.layout === "split" && (
              <SplitRows sec={sec} resolveItemLink={resolveItemLink} />
            )}

            {sec.type === "feature_block" && sec.layout === "grid" && (
              <GridCards sec={sec} resolveItemLink={resolveItemLink} />
            )}

            {sec.type === "feature_block" && !sec.layout && (
              <div className={`space-y-6 ${sec.image_url && !sec.items?.length ? "text-center" : ""}`}>
                {(sec.heading || sec.subheading) && (
                  <div className={`space-y-3 ${sec.image_url && !sec.items?.length ? "mx-auto max-w-4xl" : "max-w-3xl"}`}>
                    {sec.heading && (
                      <h2 className="text-2xl font-extrabold text-[#004E86] sm:text-3xl">
                        {sec.heading}
                      </h2>
                    )}
                    {sec.subheading && (
                      <p className={`leading-relaxed text-slate-600 ${sec.image_url && !sec.items?.length ? "text-base sm:text-lg" : "text-sm"}`}>
                        {sec.subheading}
                      </p>
                    )}
                  </div>
                )}
                {sec.image_url && (
                  <div className="w-full flex justify-center py-4">
                    <img
                      src={sec.image_url}
                      alt={sec.heading || ""}
                      className="w-full max-w-5xl h-auto object-contain rounded-xl"
                    />
                  </div>
                )}
                {sec.secondary_images && sec.secondary_images.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                    {sec.secondary_images.map((img, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex justify-center"
                      >
                        <img
                          src={img}
                          alt={`Feature detail ${i + 1}`}
                          className="max-h-64 object-contain rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                )}
                {sec.items && sec.items.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 pt-2">
                    {sec.items.map((item, i) => (
                      <div key={i} className="space-y-1.5">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
                          {item.title}
                        </h3>
                        {item.description && (
                          <p className="text-sm text-slate-700 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Diagram callout: 6-column image on left, 2-column numbered callouts on right, no outer container */}
            {sec.type === "diagram_callout" &&
              !!sec.items?.length &&
              sec.items.every((item) => item.image_url && item.title) && (
              <div className="space-y-8">
                <div className="max-w-3xl space-y-2">
                  <h2 className="text-2xl font-extrabold text-slate-900">{sec.heading}</h2>
                  {sec.subheading && (
                    <p className="text-sm text-slate-600 leading-relaxed">{sec.subheading}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                  {sec.image_url && (
                    <div className="lg:col-span-6">
                      <img
                        src={sec.image_url}
                        alt={sec.heading || "Product diagram"}
                        className="w-full h-auto object-contain"
                      />
                    </div>
                  )}
                  <ul
                    className={`${sec.image_url ? "lg:col-span-6" : "lg:col-span-12"} ${
                      sec.columns === 2 ? "grid sm:grid-cols-2 gap-x-8 gap-y-3" : "space-y-3"
                    }`}
                  >
                    {sec.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <img
                          src={item.image_url}
                          alt=""
                          className="mt-0.5 h-5 w-5 shrink-0 object-contain"
                        />
                        <span className="text-sm text-slate-800 leading-snug">{item.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {sec.type === "diagram_callout" &&
              !(sec.items?.length && sec.items.every((item) => item.image_url && item.title)) && (
              <div className="space-y-8">
                <div className="max-w-3xl space-y-2">
                  <h2 className="text-2xl font-extrabold text-slate-900">{sec.heading}</h2>
                  {sec.subheading && (
                    <p className="text-sm text-slate-600 leading-relaxed">{sec.subheading}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                  {sec.image_url && (
                    <div className="lg:col-span-6 flex justify-center">
                      <img
                        src={sec.image_url}
                        alt={sec.heading || "Product diagram"}
                        className="w-full max-w-lg lg:max-w-none rounded-2xl object-contain"
                        loading="lazy"
                      />
                    </div>
                  )}
                  {sec.items && sec.items.length > 0 && (
                    <div
                      className={`grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 ${sec.image_url ? "lg:col-span-6" : "lg:col-span-12"}`}
                    >
                      {sec.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={`${i + 1}`}
                              className="w-7 h-7 object-contain shrink-0"
                              loading="lazy"
                            />
                          ) : (
                            <span className="w-7 h-7 rounded-full border border-cyan-400 text-cyan-600 font-medium text-xs flex items-center justify-center shrink-0">
                              {i + 1}
                            </span>
                          )}
                          <div>
                            <span className="text-sm font-medium text-slate-800 block leading-snug">
                              {item.title}
                            </span>
                            {item.description && (
                              <span className="text-xs text-slate-500 block mt-0.5 leading-snug">
                                {item.description}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {sec.type === "water_flow_improvement" && (
              <div className="space-y-6">
                <div className="max-w-3xl space-y-2">
                  <h2 className="text-2xl font-extrabold text-slate-900">{sec.heading}</h2>
                  {sec.subheading && (
                    <p className="text-sm text-slate-600 leading-relaxed">{sec.subheading}</p>
                  )}
                </div>
                {sec.image_url && (
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex justify-center">
                    <img
                      src={sec.image_url}
                      alt={sec.heading}
                      className="max-h-64 object-contain"
                    />
                  </div>
                )}
                {sec.items && sec.items.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {sec.items.map((item, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 flex flex-col items-center text-center"
                      >
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="h-20 object-contain"
                          />
                        )}
                        <h3 className="text-xs font-bold text-slate-900">{item.title}</h3>
                        {item.description && (
                          <p className="text-[11px] text-slate-500 leading-tight">
                            {item.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {sec.type === "flow_examples" && <FlowExamples sec={sec} />}

            {sec.type === "tech_specs_table" && sec.specs_table && (
              <div className="space-y-6">
                {(sec.heading || sec.subheading) && (
                  <div className="space-y-1">
                    {sec.heading && (
                      <h2 className="text-2xl font-extrabold text-slate-900">{sec.heading}</h2>
                    )}
                    {sec.subheading && <p className="text-sm text-slate-600">{sec.subheading}</p>}
                  </div>
                )}
                {sec.image_url && (
                  <img
                    src={sec.image_url}
                    alt={sec.heading || "Specification"}
                    className="mx-auto w-full max-w-3xl h-auto object-contain"
                  />
                )}
                <div className="rounded-2xl bg-slate-50 border border-slate-200 overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-white text-cyan-600 font-mono uppercase">
                        <th className="p-4 font-bold">Specification</th>
                        {[
                          ...new Set(
                            Object.values(sec.specs_table).flatMap((row) => Object.keys(row)),
                          ),
                        ].map((m) => (
                          <th key={m} className="p-4 font-bold">
                            {m}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/80">
                      {Object.entries(sec.specs_table).map(([specKey, values]) => (
                        <tr key={specKey} className="hover:bg-slate-100/60 transition-colors">
                          <td className="p-4 font-medium text-slate-600">{specKey}</td>
                          {[
                            ...new Set(
                              Object.values(sec.specs_table).flatMap((row) => Object.keys(row)),
                            ),
                          ].map((m) => (
                            <td key={m} className="p-4 font-mono font-bold text-slate-900">
                              {values[m] || "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
          })}
        </div>
      ))}
    </section>
  );
}

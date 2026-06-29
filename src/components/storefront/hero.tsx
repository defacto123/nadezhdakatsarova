import NextImage from "next/image";

export function Hero({
  artUrl,
  artAlt,
  brushUrl,
}: {
  artUrl: string | null;
  artAlt: string;
  brushUrl: string | null;
}) {
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="container-page relative grid min-h-[26rem] items-center gap-8 py-12 md:min-h-[34rem] md:grid-cols-2 md:py-20">
        {/* Left: decorative watercolor brush stroke */}
        <div className="relative order-2 flex items-center justify-center md:order-1">
          {brushUrl && (
            <NextImage
              src={brushUrl}
              alt=""
              aria-hidden
              width={560}
              height={208}
              className="h-auto w-3/4 max-w-md object-contain"
              unoptimized={brushUrl.startsWith("data:")}
              priority
            />
          )}
        </div>

        {/* Right: main illustration */}
        <div className="relative order-1 flex items-end justify-center md:order-2">
          {artUrl && (
            <NextImage
              src={artUrl}
              alt={artAlt}
              width={520}
              height={636}
              className="h-auto max-h-[24rem] w-auto object-contain md:max-h-[30rem]"
              unoptimized={artUrl.startsWith("data:")}
              priority
            />
          )}
        </div>
      </div>
    </section>
  );
}

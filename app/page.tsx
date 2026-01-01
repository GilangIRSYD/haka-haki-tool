import { Link } from "@heroui/link";
import { Snippet } from "@heroui/snippet";
import { Code } from "@heroui/code";
import { button as buttonStyles } from "@heroui/theme";

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/lib/utils";
import { GithubIcon } from "@/components/icons";

export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <span className={title()}>Indonesian&nbsp;</span>
        <span className={title({ color: "violet" })}>Stock Market&nbsp;</span>
        <br />
        <span className={title()}>
          Broker Accumulation Analysis Platform
        </span>
        <div className={subtitle({ class: "mt-4" })}>
          Analyze broker buying and selling patterns for Indonesian stocks with modern visualization tools.
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          className={buttonStyles({
            color: "primary",
            radius: "full",
            variant: "shadow",
          })}
          href="/analyzer"
        >
          Launch Analyzer
        </Link>
        <Link
          isExternal
          className={buttonStyles({ variant: "bordered", radius: "full" })}
          href={siteConfig.links.docs}
        >
          Documentation
        </Link>
      </div>

      <div className="mt-8">
        <Snippet hideCopyButton hideSymbol variant="bordered">
          <span>
            Track broker accumulation patterns to make informed investment decisions
          </span>
        </Snippet>
      </div>
    </section>
  );
}

import { styleClass } from "@/styles/runtime";
import { Earth, Moon, Sparkles, Star } from "@/components/elements/icons";
export function SpaceScene() {
  return (
    <div className="space-scene fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="space-orbit border border-star-color border-dashed rounded-full opacity-45 max-tablet:opacity-25" />
      <Earth
        className={styleClass("space-earth text-planet-color opacity-55 max-tablet:opacity-25")}
        width={96}
        height={96}
      />
      <Moon
        className={styleClass("space-moon text-planet-shadow max-tablet:opacity-40")}
        width={48}
        height={48}
      />
      <Sparkles
        className={styleClass("space-sparkles right-6 bottom-16 text-star-color")}
        width={48}
        height={48}
      />
      <Star className={styleClass("space-star right-5 text-accent opacity-50")} width={24} height={24} />
    </div>
  );
}

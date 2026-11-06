import { Earth, Moon, Sparkles, Star } from "@/shared/icons";
export function SpaceScene() {
  return (
    <div className="space-scene" aria-hidden="true">
      <div className="space-orbit" />
      <Earth className="space-earth" width={96} height={96} />
      <Moon className="space-moon" width={48} height={48} />
      <Sparkles className="space-sparkles" width={48} height={48} />
      <Star className="space-star" width={24} height={24} />
    </div>
  );
}

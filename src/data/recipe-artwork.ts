import acidBogUrl from '../assets/recipes/acid-bog.webp';
import acidSparkUrl from '../assets/recipes/acid-spark.webp';
import brightDewUrl from '../assets/recipes/bright-dew.webp';
import dragonVoidUrl from '../assets/recipes/dragon-void.webp';
import dustyVoidUrl from '../assets/recipes/dusty-void.webp';
import emberSoupUrl from '../assets/recipes/ember-soup.webp';
import frostAcidUrl from '../assets/recipes/frost-acid.webp';
import frostSteamUrl from '../assets/recipes/frost-steam.webp';
import frozenAshUrl from '../assets/recipes/frozen-ash.webp';
import heavyAcidUrl from '../assets/recipes/heavy-acid.webp';
import moonMistUrl from '../assets/recipes/moon-mist.webp';
import phoenixPulseUrl from '../assets/recipes/phoenix-pulse.webp';
import quietSwirlUrl from '../assets/recipes/quiet-swirl.webp';
import rootBloomUrl from '../assets/recipes/root-bloom.webp';
import rootedNightUrl from '../assets/recipes/rooted-night.webp';
import slimeCrownUrl from '../assets/recipes/slime-crown.webp';
import snowDustUrl from '../assets/recipes/snow-dust.webp';
import tripleEclipseUrl from '../assets/recipes/triple-eclipse.webp';
import voidEmberUrl from '../assets/recipes/void-ember.webp';
import voidFlameUrl from '../assets/recipes/void-flame.webp';

const RECIPE_ARTWORK: Readonly<Record<string, string>> = {
  'moon-mist': moonMistUrl,
  'root-bloom': rootBloomUrl,
  'frost-steam': frostSteamUrl,
  'quiet-swirl': quietSwirlUrl,
  'bright-dew': brightDewUrl,
  'snow-dust': snowDustUrl,
  'acid-spark': acidSparkUrl,
  'void-ember': voidEmberUrl,
  'heavy-acid': heavyAcidUrl,
  'frost-acid': frostAcidUrl,
  'dusty-void': dustyVoidUrl,
  'dragon-void': dragonVoidUrl,
  'rooted-night': rootedNightUrl,
  'phoenix-pulse': phoenixPulseUrl,
  'slime-crown': slimeCrownUrl,
  'void-flame': voidFlameUrl,
  'acid-bog': acidBogUrl,
  'frozen-ash': frozenAshUrl,
  'triple-eclipse': tripleEclipseUrl,
  'ember-soup': emberSoupUrl,
};

export const getRecipeArtworkUrl = (recipeId: string): string | undefined =>
  RECIPE_ARTWORK[recipeId];

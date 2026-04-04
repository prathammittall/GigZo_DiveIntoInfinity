const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

// ── Allow Metro to resolve files outside mobile_app/ ─────────────────────────
// Needed so @ai/* imports from ai_model/client/ work across the repo.
config.watchFolders = [monorepoRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// ── @ai path alias → ai_model/client/ ────────────────────────────────────────
config.resolver.extraNodeModules = {
  "@ai": path.resolve(monorepoRoot, "ai_model", "client"),
};

module.exports = config;

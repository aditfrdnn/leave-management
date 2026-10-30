import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

eslintConfig.push({
  rules: {
    'react-hooks/exhaustive-deps': 'off',
    'react/jsx-key': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    "@typescript-eslint/no-unsafe-function-type": "error",
    // Type scale (docs/typography.md): no 700 weight and no arbitrary font sizes in class names.
    "no-restricted-syntax": ["error",
      {
        selector: "Literal[value=/(^|\\s|:)font-(bold|extrabold|black)(\\s|$)/], TemplateElement[value.raw=/(^|\\s|:)font-(bold|extrabold|black)(\\s|$)/]",
        message: "Use font-semibold (600) for titles and numbers; 700 is not in the type scale (docs/typography.md).",
      },
      {
        selector: "Literal[value=/(^|\\s|:)text-\\[[0-9.]+(px|rem)\\]/], TemplateElement[value.raw=/(^|\\s|:)text-\\[[0-9.]+(px|rem)\\]/]",
        message: "Use a step of the type scale (text-2xs … text-4xl or a type-* role) instead of an arbitrary font size.",
      },
    ],
    // Icons go through the wrapper so they share the app's 2px stroke.
    "no-restricted-imports": ["error", {
      paths: [{
        name: "@hugeicons/react",
        importNames: ["HugeiconsIcon"],
        message: "Import HugeiconsIcon from \"@/components/ui/hugeicons-icon\" (2px stroke).",
      }],
    }],
  },
});

eslintConfig.push({
  files: ["src/components/ui/hugeicons-icon.tsx"],
  rules: { "no-restricted-imports": "off" },
});

export default eslintConfig;

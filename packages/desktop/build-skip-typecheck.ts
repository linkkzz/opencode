#!/usr/bin/env bun
import { $ } from "bun"

console.log("Building frontend...")
await $`bun x vite build`

console.log("Building Tauri app...")
await $`bun x @tauri-apps/cli build --bundles dmg`

console.log("Build complete!")

import { Provider } from "./src/provider/provider"

async function main() {
  console.log("=== Starting Provider Debug ===")

  const providers = await Provider.list()
  console.log("\n=== Loaded Providers ===")
  console.log(`Total providers: ${Object.keys(providers).length}`)

  for (const [key, value] of Object.entries(providers)) {
    const models = Object.keys(value.models || {})
    console.log(`\n${key}:`)
    console.log(`  Source: ${value.source}`)
    console.log(`  Total models: ${models.length}`)
    if (models.length > 0 && models.length <= 10) {
      console.log(`  Models: ${models.join(", ")}`)
    } else if (models.length > 10) {
      console.log(`  First 10 models: ${models.slice(0, 10).join(", ")} ...`)
    }
  }
}

main().catch(console.error)

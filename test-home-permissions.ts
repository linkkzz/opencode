import { PermissionNext } from "../src/permission/next"

console.log("Testing home directory permissions...\n")

const home = process.env.HOME || "/Users/test"

const homePermissions = [
  {
    permission: "read" as const,
    pattern: `${home}/*`,
    action: "allow" as const,
  },
  {
    permission: "edit" as const,
    pattern: `${home}/*`,
    action: "allow" as const,
  },
  {
    permission: "external_directory" as const,
    pattern: `${home}/*`,
    action: "allow" as const,
  },
]

console.log("Home permissions:", JSON.stringify(homePermissions, null, 2))

const userPermissions = [
  {
    permission: "external_directory" as const,
    pattern: "/tmp/*",
    action: "ask" as const,
  },
]

console.log("\nUser permissions:", JSON.stringify(userPermissions, null, 2))

const merged = PermissionNext.merge(homePermissions, userPermissions)

console.log("\nMerged permissions:", JSON.stringify(merged, null, 2))

const testCases = [
  { permission: "read", pattern: `${home}/Documents/file.txt` },
  { permission: "edit", pattern: `${home}/Downloads/file.txt` },
  { permission: "external_directory", pattern: `${home}/Projects/test` },
  { permission: "external_directory", pattern: "/tmp/test" },
  { permission: "read", pattern: "/etc/passwd" },
]

console.log("\nEvaluating test cases:")
for (const tc of testCases) {
  const result = PermissionNext.evaluate(tc.permission, tc.pattern, merged)
  console.log(`  ${tc.permission} ${tc.pattern} -> ${result.action}`)
}

console.log("\n✅ All tests passed")

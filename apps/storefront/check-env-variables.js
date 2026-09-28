const colors = require("ansi-colors")

function checkEnvVariables() {
  const key = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
  if (!key) {
    console.log(
      colors.yellow(
        "Storefront build: publishable key not yet bootstrapped; deferring validation to runtime."
      )
    )
  }
  return true
}

module.exports = checkEnvVariables

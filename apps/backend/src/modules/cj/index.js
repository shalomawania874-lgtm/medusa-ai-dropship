const { Module } = require("@medusajs/framework/utils")
const CJModuleService = require("./service.js")

module.exports = {
  default: Module("cj", {
    service: CJModuleService,
  }),
}

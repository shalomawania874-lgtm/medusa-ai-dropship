const { Module } = require("@medusajs/framework/utils")
const CJModuleService = require("./service.ts").default || require("./service.ts")
module.exports = Module("cj", { service: CJModuleService })

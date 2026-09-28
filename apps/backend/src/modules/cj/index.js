const { Module } = require("@medusajs/framework/utils")
const CJModuleService = require("./service.js")
const definition = Module("cj", { service: CJModuleService })
module.exports = { default: definition }

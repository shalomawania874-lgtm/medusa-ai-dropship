const { Module } = require("@medusajs/framework/utils")
const CJModuleService = require("./service.js")
module.exports = Module("cj", { service: CJModuleService })
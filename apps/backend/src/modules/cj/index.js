const { Module } = require("@medusajs/framework/utils")
const CJModuleService = require("./service.js")
const CJ_MODULE = "cj"
module.exports = Module(CJ_MODULE, { service: CJModuleService })

const { Module } = require("@medusajs/framework/utils")
const CJModuleService = require("./service.js")

const CJ_MODULE = "cj"

exports.default = Module(CJ_MODULE, { service: CJModuleService })

const { Module } = require("@medusajs/framework/utils")
const service = require("./service.js")
const definition = Module("cj", { service })
exports.default = definition
exports.key = definition.key
exports.serviceName = definition.serviceName
exports.service = definition.service
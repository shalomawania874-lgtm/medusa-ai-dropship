import { Module } from "@medusajs/framework/utils"
import CJModuleService from "./service"

export default Module("cj", {
  service: CJModuleService,
})

import { Module } from "@medusajs/framework/utils"
import CJModuleService from "./service"
export const CJ_MODULE = "cj"
export default Module(CJ_MODULE, { service: CJModuleService })

/**
 * quantclass-client
 * Copyright (c) 2025 量化小讲堂
 *
 * Licensed under the Business Source License 1.1 (BUSL-1.1).
 * Additional Use Grant: None
 * Change Date: 2028-08-22 | Change License: GPL-3.0-or-later
 * See the LICENSE file and https://mariadb.com/bsl11/
 */

import { AnimatedRainbowCard } from "@/renderer/components/ui/animated-rainbow-card"
import ButtonTooltip from "@/renderer/components/ui/button-tooltip"
import { Input as InputUI } from "@/renderer/components/ui/input"
import { TimePicker } from "@/renderer/components/ui/time-picker"
import { ALLOWED_HOLD_PERIODS } from "@/renderer/constant/strategy"
import { cn } from "@/renderer/lib/utils"
import { useFormValidation } from "@/renderer/page/strategy/form-validation"
import type {
	SelectStgFormData,
	SelectStgFormProps,
} from "@/renderer/page/strategy/types"
import { SelectStgFormSchema } from "@/renderer/schemas/strategy"
import { formatTime } from "@/renderer/utils/time"
import { autoTradeTimeByRebTime } from "@/renderer/utils/trade"
import { Input } from "@heroui/input"
import { Select, SelectItem, SelectSection } from "@heroui/select"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@renderer/components/ui/button"
import { CardContent, CardFooter } from "@renderer/components/ui/card"
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@renderer/components/ui/form"
import {
	Biohazard,
	CircleHelp,
	CircuitBoard,
	Filter,
	Loader,
	Shuffle,
} from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

export function SelectStgForm({
	defaultValues,
	submitText = "保存策略",
	// name,
	onSave,
}: SelectStgFormProps) {
	const form = useForm<SelectStgFormData>({
		resolver: zodResolver(SelectStgFormSchema),
		defaultValues,
	})
	const [saving, setSaving] = useState(false)

	// -- 表单验证和提交逻辑
	const validateAndSubmit = async (data: SelectStgFormData) => {
		const { validateFormData } = useFormValidation(form)
		return await validateFormData(data)
	}

	const handleSubmit = async () => {
		const data = form.getValues()
		const isValid = await form.trigger()

		if (!isValid) {
			toast.error("表单数据不合法")
			console.log(form.formState.errors)

			return
		}

		if (
			!(await validateAndSubmit({
				...data,
				rebalance_time: data.rebalance_time ?? "close-open",
			}))
		)
			return

		setTimeout(() => {
			onSave({
				...form.getValues(),
				select_num: Number(form.getValues("select_num")),
				rebalance_time: form.getValues("rebalance_time") || "close-open",
				buy_time: formatTime(form.getValues("buy_time")),
				sell_time: formatTime(form.getValues("sell_time")),
				split_order_amount: Number(form.getValues("split_order_amount")),
			})
			setSaving(false)
		}, 150)
	}

	return (
		<Form {...form}>
			<form>
				<CardContent className="p-0">
					<div
						className="flex flex-col gap-4 overflow-auto min-h-[250px] max-h-[550px] p-4"
						style={{ height: "calc(100vh * 0.6)" }}
					>
						<FormField
							control={form.control}
							name="select_num"
							render={({ field, formState }) => (
								<FormItem>
									<FormControl>
										<Input
											type="number"
											{...field}
											value={field.value?.toString()}
											min={1}
											label="选股数量"
											isRequired
											variant="bordered"
											errorMessage={formState.errors.select_num?.message}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="hold_period"
							render={({ field }) => (
								<FormItem>
									<Select
										isRequired
										className="relative z-50"
										variant="bordered"
										selectedKeys={[field.value!]}
										onChange={(e) => {
											const new_value = e.target.value
											if (!new_value) return

											form.setValue("offset_list", "0")
											field.onChange(e)
										}}
										label="持仓周期"
									>
										<SelectSection title="日级别">
											{ALLOWED_HOLD_PERIODS.day.map((item: string) => (
												<SelectItem key={item}>{item}</SelectItem>
											))}
										</SelectSection>

										<SelectSection title="周级别">
											{ALLOWED_HOLD_PERIODS.week.map((item: string) => (
												<SelectItem key={item}>{item}</SelectItem>
											))}
										</SelectSection>

										<SelectSection title="月级别">
											{ALLOWED_HOLD_PERIODS.month.map((item: string) => (
												<SelectItem key={item}>{item}</SelectItem>
											))}
										</SelectSection>
									</Select>
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="factor_list"
							render={({ field }) => (
								<FormItem className={cn("flex flex-col px-1")}>
									<FormLabel className="flex items-center gap-1">
										<CircuitBoard className="size-4 mr-1" />
										选股因子列表{" "}
										<span className="text-xs">（暂不支持直接编辑）</span>
									</FormLabel>

									<div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
										<span>因子名称</span>
										<span>排序方式</span>
										<span>因子参数</span>
										<span>因子计算参数（比如权重）</span>
									</div>

									<div className="space-y-2">
										{field.value?.map(
											(
												factor: [string, boolean, any, string | number | null],
												index: number,
											) => (
												<div key={+index} className="grid grid-cols-4 gap-2">
													<FormControl>
														<InputUI
															value={factor[0]} // -- 因子名称
															className="text-muted-foreground text-xs"
															readOnly
														/>
													</FormControl>
													<FormControl>
														<InputUI
															value={
																factor[1] ? "从小到大排序" : "从大到小排序"
															} // -- 排序方式
															className="text-muted-foreground text-xs"
															readOnly
														/>
													</FormControl>
													<FormControl>
														<InputUI
															value={
																factor[2] !== null
																	? JSON.stringify(factor[2])
																	: "无参数"
															} // -- 因子参数
															className="text-muted-foreground text-xs font-mono"
															readOnly
														/>
													</FormControl>
													<FormControl>
														<InputUI
															value={factor[3] ?? ""} // -- 因子计算参数（比如权重）
															className="text-muted-foreground text-xs"
															readOnly
														/>
													</FormControl>
												</div>
											),
										)}
									</div>

									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="filter_list"
							render={({ field }) => (
								<FormItem className={cn("flex flex-col px-1")}>
									<FormLabel className="flex items-center gap-1">
										<Filter className="size-4 mr-1" />
										过滤因子列表
										<span className="text-xs">（暂不支持直接编辑）</span>
									</FormLabel>

									<div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
										<span>因子名称</span>
										<span>因子参数</span>
										<span>过滤条件</span>
										<span>排序方式</span>
									</div>
									<div className="space-y-2">
										{field.value?.map(
											(
												filter: [
													string, // 因子名称
													any, // 因子参数
													string, // 过滤条件
													boolean | undefined, // 排序方式
												],
												index: number,
											) => (
												<div key={+index} className="grid grid-cols-4 gap-2">
													<FormControl>
														<InputUI
															value={filter[0]} // -- 因子名称
															className="text-muted-foreground text-xs"
															readOnly
														/>
													</FormControl>
													<FormControl>
														<InputUI
															value={JSON.stringify(filter[1])} // -- 因子参数
															className="text-muted-foreground text-xs font-mono"
															readOnly
														/>
													</FormControl>
													<FormControl>
														<InputUI
															value={filter[2]} // -- 过滤条件
															className="text-muted-foreground text-xs"
															readOnly
														/>
													</FormControl>
													<FormControl>
														<InputUI
															value={
																filter[3] === undefined
																	? "从小到大排序"
																	: filter[3]
																		? "从小到大排序"
																		: "从大到小排序"
															} // -- 启用状态
															className="text-muted-foreground text-xs"
															readOnly
														/>
													</FormControl>
												</div>
											),
										)}
									</div>

									<FormMessage />
								</FormItem>
							)}
						/>

						{/* 盘中择时功能 */}
						<button
							type="button"
							className="w-full text-left cursor-pointer"
							onClick={() => {
								window.electronAPI.openUrl(
									"https://www.quantclass.cn/fen/class/fen-2025",
								)
							}}
						>
							<AnimatedRainbowCard>
								<div className="flex items-center gap-2 text-blue-900 dark:text-blue-200">
									<Biohazard className="size-4" />
									<span className="font-medium">盘中择时功能</span>
									<span className="text-xs px-2 py-0.5 rounded-full bg-primary text-white">
										分享会专享功能
									</span>
									<div className="flex-1" />
									<CircleHelp className="w-4 h-4 text-blue-700 dark:text-blue-300" />
								</div>
								<p className="text-xs text-blue-800 dark:text-blue-300 mt-2">
									点击了解更多关于盘中择时的高级功能
								</p>
							</AnimatedRainbowCard>
						</button>

						<hr />

						<div className="flex flex-col gap-3 bg-gray-100 border p-2 rounded-lg dark:bg-black">
							<h3 className="text-sm text-warning-600 dark:text-warning flex items-center gap-1">
								<Biohazard className="size-4 mr-1 font-bold" />
								以下为高阶配置，默认会自动随机生成，无需手动设置。如果你不太了解，千万不要修改！
							</h3>
							<FormField
								control={form.control}
								name="split_order_amount"
								render={({ field }) => (
									<FormItem className="flex flex-col">
										<FormLabel className="flex items-center gap-1">
											<span>🧬 拆单金额</span>
											<ButtonTooltip content="拆单金额默认在 6000 到 12000 之间随机取值">
												<CircleHelp className="w-4 h-4 text-muted-foreground hover:cursor-pointer" />
											</ButtonTooltip>
										</FormLabel>

										<FormControl>
											<InputUI
												{...field}
												type="number"
												min={6000}
												max={12000}
												className="bg-background"
											/>
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="sell_time"
								render={({ field }) => (
									// TODO: 删除 hidden
									<FormItem className="flex flex-col">
										<FormLabel className="flex items-center gap-1">
											<span>🈳 卖出时间</span>
											<ButtonTooltip content="保存时随机生成，或点击下方按钮随机生成">
												<CircleHelp className="w-4 h-4 text-muted-foreground hover:cursor-pointer" />
											</ButtonTooltip>
										</FormLabel>

										<FormControl>
											<TimePicker {...field} granularity="second" isReadOnly />
										</FormControl>
										<p className="text-muted-foreground text-xs pl-1">
											当日换仓：根据换仓时间的 前1分钟 到
											后10分钟，并随机秒数；隔日换仓：收盘前10分钟内随机，并随机秒数
										</p>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="buy_time"
								render={({ field }) => (
									<FormItem className="flex flex-col">
										<FormLabel className="flex items-center gap-1">
											<span>🈵 买入时间</span>
											<ButtonTooltip content="保存时随机生成，或点击下方按钮随机生成">
												<CircleHelp className="w-4 h-4 text-muted-foreground hover:cursor-pointer" />
											</ButtonTooltip>
										</FormLabel>

										<FormControl>
											<TimePicker {...field} isReadOnly granularity="second" />
										</FormControl>
										<p className="text-muted-foreground text-xs pl-1">
											分钟换仓：根据随机后的卖出时间，延迟 60 到 120
											秒随机间隔；其他换仓：按开盘时间，随机买入时间
										</p>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Button
								size="sm"
								variant="outline"
								className="w-52"
								onClick={(e) => {
									e.preventDefault()
									const { sell_time, buy_time } =
										autoTradeTimeByRebTime("close-open")
									form.setValue("sell_time", sell_time)
									form.setValue("buy_time", buy_time)
								}}
							>
								<Shuffle className="w-4 h-4 mr-2" />
								随机生成买入、卖出时间
							</Button>
						</div>
					</div>
				</CardContent>

				<CardFooter className="flex justify-end border-t p-4">
					<Button
						onClick={async (e) => {
							e.preventDefault()
							setSaving(true)
							await handleSubmit()
						}}
						disabled={saving}
					>
						{saving ? (
							<>
								<Loader className="animate-spin h-5 mr-2" /> 保存中...
							</>
						) : (
							submitText
						)}
					</Button>
				</CardFooter>
			</form>
		</Form>
	)
}

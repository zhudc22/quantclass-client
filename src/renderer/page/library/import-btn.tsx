/**
 * quantclass-client
 * Copyright (c) 2025 量化小讲堂
 *
 * Licensed under the Business Source License 1.1 (BUSL-1.1).
 * Additional Use Grant: None
 * Change Date: 2028-08-22 | Change License: GPL-3.0-or-later
 * See the LICENSE file and https://mariadb.com/bsl11/
 */

import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/renderer/components/ui/alert-dialog"
import { Button } from "@/renderer/components/ui/button"
import ButtonTooltip from "@/renderer/components/ui/button-tooltip"
import {
	Dialog,
	DialogContent,
	DialogTitle,
} from "@/renderer/components/ui/dialog"
import { DialogFooter, DialogHeader } from "@/renderer/components/ui/dialog"
import { useToggleAutoRealTrading } from "@/renderer/hooks"
import { useStrategyManager } from "@/renderer/hooks/useStrategyManager"
import { backtestConfigAtom } from "@/renderer/store/storage"
import { selectStgListAtom } from "@/renderer/store/storage"
import type { SelectStgType } from "@/renderer/types/strategy"
import { openRealTradingFolder } from "@/renderer/utils"
import { useMutation } from "@tanstack/react-query"
import { useAtomValue, useSetAtom } from "jotai"
import {
	Eraser,
	FolderDown,
	FolderOpen,
	Loader2,
	OctagonAlert,
	Scale,
	ShieldCheck,
	TriangleAlert,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import TradeCtrlBtn from "../../components/trade-ctrl-btn"

export default function StgImportButton() {
	const { selectFile, setStoreValue, importSelectStock } = window.electronAPI

	const [pending, setPending] = useState(false)
	const [importOpen, setImportOpen] = useState(false)
	const [deleteOpen, setDeleteOpen] = useState(false)
	const selectStgList = useAtomValue(selectStgListAtom)

	const setBacktestConfig = useSetAtom(backtestConfigAtom)
	const { isAutoRocket, handleToggleAutoRocket } = useToggleAutoRealTrading()
	const { resetSelectStgList, addStrategy } = useStrategyManager()
	const { mutateAsync: importLibraryDir, isPending } = useMutation({
		mutationKey: ["import-library"],
		mutationFn: async (configFilePath: string) =>
			await importSelectStock(configFilePath),
		onSuccess: async (data) => {
			const { configJson: strategyStr = "" } = data
			const strategyJson = JSON.parse(strategyStr)

			if (strategyJson) {
				await addStrategy({
					...strategyJson,
					cap_weight: 0, // 导入时，资金占比重置为 0
				} as SelectStgType)
				// -- Set to config json store
				setStoreValue("select_stock_lite.backtest_name", "选股策略库")
				// -- Set to render local storage
				setBacktestConfig((p) => ({
					...p,
					backtest_name: "选股策略库",
				}))
			}
			setImportOpen(false)
			toast.success("导入成功")
		},
		onError: () => {
			toast.dismiss()
			toast.error("导入失败")
		},
	})

	return (
		<>
			{isAutoRocket && <TradeCtrlBtn size="sm" className="h-8 lg:flex" />}
			<ButtonTooltip content="请选择策略代码下的 config 文件">
				<Button
					size="sm"
					variant="outline"
					className="h-8 lg:flex"
					disabled={isAutoRocket || selectStgList.length >= 3}
					onClick={() => setImportOpen(true)}
				>
					<FolderDown className="size-4 mr-2" />
					添加策略
				</Button>
			</ButtonTooltip>

			<ButtonTooltip content="清空当前策略库所有策略">
				<Button
					onClick={() => setDeleteOpen(true)}
					size="sm"
					variant="outline"
					disabled={isAutoRocket}
					className="h-8 hover:bg-destructive/90 hover:text-destructive-foreground text-foreground lg:flex"
				>
					<Eraser className="size-4 mr-2" />
					清空选股策略
				</Button>
			</ButtonTooltip>
			<ButtonTooltip
				content="打开存放“策略库”和“因子库”的文件夹，方便查看、确认已导入的策略信息"
				delayDuration={100}
			>
				<Button
					onClick={async () => {
						setPending(true)
						await openRealTradingFolder()
						setTimeout(() => setPending(false), 750)
					}}
					size="sm"
					disabled={pending}
					variant="outline"
					className="h-8 gap-1 lg:flex"
				>
					{pending ? (
						<Loader2 size={16} className="animate-spin" />
					) : (
						<FolderOpen size={16} />
					)}
					打开文件夹
				</Button>
			</ButtonTooltip>
			<Dialog open={importOpen} onOpenChange={setImportOpen}>
				<DialogContent className="p-4">
					<DialogHeader>
						<DialogTitle className="flex items-center">
							导入策略到选股策略库
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-1">
						<span className="text-sm">ℹ️ 导入说明：</span>
						<ul className="list-inside space-y-2">
							<li className="flex items-center">
								<Eraser size={18} className="mr-2" /> 导入会{" "}
								<span className="text-danger">追加</span>
								到当前策略库中，同名策略不会覆盖
							</li>
							<li className="flex items-center">
								<ShieldCheck size={18} className="mr-2" />
								导入成功后，为了资金安全，策略资金占比都
								<span className="text-blue-400">重置为 0</span>
							</li>
							<li className="flex items-center">
								<Scale size={18} className="mr-2" />
								需要在页面上<span className="text-warning-600">重新配置</span>
								回测和实盘资金权重
							</li>
						</ul>
					</div>
					<hr />
					<div className="bg-warning-100 text-warning-600 py-2 px-3 rounded-lg leading-relaxed text-sm">
						<p className="flex items-center gap-2 font-bold">
							<TriangleAlert size={18} /> 导入提示
						</p>
						<div className="text-xs leading-relaxed">
							如果遇到导入失败，很可能你的“策略库”或者“因子库”有只读的.py文件，客户端无法自动写入。可以{" "}
							<span className="font-bold text-warning-700">打开文件夹</span> 后
							，删除 <span className="font-bold text-warning-700">策略库</span>{" "}
							和 <span className="font-bold text-warning-700">因子库</span>{" "}
							文件夹后，然后再导入
						</div>
					</div>
					<DialogFooter className="p-0">
						<Button variant="outline" onClick={() => setImportOpen(false)}>
							取消
						</Button>
						<Button
							disabled={isPending}
							className="min-w-32"
							onClick={async (e) => {
								e.preventDefault()
								e.stopPropagation()
								if (selectStgList.length >= 3) {
									toast.warning("策略库最多只能导入3个策略")
									return
								}
								handleToggleAutoRocket(false, true, true)
								// setStoreValue("auto_real_trading", false) // 关闭自动实盘
								const res = await selectFile({
									filters: [{ name: "python", extensions: ["py"] }],
								})

								res && (await importLibraryDir(res as string))
							}}
						>
							{isPending ? "导入中..." : "选择配置文件"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<AlertDialogContent className="p-4">
					<AlertDialogHeader>
						<AlertDialogTitle className="flex items-center">
							<OctagonAlert className="mr-2" /> 确认清空策略库吗？
						</AlertDialogTitle>
						<AlertDialogDescription className="py-1 leading-loose">
							<span>※ 清空之后需要从“策略代码”中重新导入，</span>
							<br />
							<span>※ 并且配置资金占比。</span>
							<br />
							<span>※ 同时会自动关闭“自动实盘”的选项。</span>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>取消</AlertDialogCancel>
						<Button
							variant={"destructive"}
							onClick={async () => {
								resetSelectStgList() // 清空策略库
								handleToggleAutoRocket(false, true, true).then(() => {
									setDeleteOpen(false)
									toast.success("清空成功")
								})
							}}
						>
							<Eraser className="mr-2" /> 清空策略库，继续
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}

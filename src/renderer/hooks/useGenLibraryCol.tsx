/**
 * quantclass-client
 * Copyright (c) 2025 量化小讲堂
 *
 * Licensed under the Business Source License 1.1 (BUSL-1.1).
 * Additional Use Grant: None
 * Change Date: 2028-08-22 | Change License: GPL-3.0-or-later
 * See the LICENSE file and https://mariadb.com/bsl11/
 */

import EditableNumberCell from "@/renderer/components/EditableNumberCell"
import { Badge } from "@/renderer/components/ui/badge"
import { DataTableColumnHeader } from "@/renderer/components/ui/data-table-column-heder"
import { useToggleAutoRealTrading } from "@/renderer/hooks"
import { DeleteStrategy } from "@/renderer/page/strategy/delete"
import StrategyEditDialog from "@/renderer/page/strategy/edit-dialog"
import type { SelectStgType } from "@/renderer/types/strategy"

import { useFusionManager } from "@/renderer/hooks/useFusionManager"
import { useStrategyManager } from "@/renderer/hooks/useStrategyManager"
import { CheckCircledIcon } from "@radix-ui/react-icons"
import type { ColumnDef } from "@tanstack/react-table"
import { useAtomValue } from "jotai"
import { totalWeightAtom } from "../store/storage"

export const useGenLibraryColumn = (
	refresh: () => void,
	isDisabled = false,
	fusionIndex = -1,
): ColumnDef<SelectStgType>[] => {
	const totalWeight = useAtomValue(totalWeightAtom)
	const { updateFusionStgInRow } = useFusionManager()
	const { isAutoRocket } = useToggleAutoRealTrading()
	const { selectStgList, updateSelectStg } = useStrategyManager()

	return [
		{
			accessorKey: "cap_weight",
			header: () => (
				<div className="text-muted-foreground flex items-baseline gap-1 text-nowrap">
					资金占比:{" "}
					<span className="text-primary text-right w-8 font-bold">
						{Math.round((totalWeight / 1000) * 1000)}%
					</span>
				</div>
			),
			size: 80,
			maxSize: 80,
			cell: ({ row }) => {
				return (
					<EditableNumberCell
						className="w-24 pr-1"
						disabled={isAutoRocket}
						value={row.original.cap_weight ?? 0}
						onChange={async (newValue) => {
							if (fusionIndex === -1) {
								updateSelectStg(row.index, {
									...selectStgList[row.index],
									cap_weight: newValue,
								})
							} else {
								updateFusionStgInRow(
									fusionIndex,
									{ cap_weight: newValue },
									row.original,
									row.index,
								)
							}
						}}
					/>
				)
			},
		},
		{
			accessorKey: "name",
			// size: 100,
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="策略名称" />
			),
			cell: ({ row }) => {
				if (row.original.cap_weight >= 0) {
					return (
						<div className="flex items-center gap-1">
							{!isDisabled && (
								<Badge variant="secondary" className="shrink-0 p-1">
									<CheckCircledIcon className="size-4 mr-1 text-success" />{" "}
									<span>实盘</span>
								</Badge>
							)}
							<span className="text-nowrap">{row.original.name}</span>
						</div>
					)
				}

				return <div>{row.original.name}</div>
			},
		},
		{
			accessorKey: "select_num",
			header: "选股数量",
			size: 60,
			enableResizing: false,
		},
		{
			accessorKey: "hold_period",
			header: "持仓周期",
			size: 60,
			enableResizing: false,
		},
		{
			id: "action",
			size: 50,
			maxSize: 80,
			header: "操作",
			cell: ({ row }) => {
				return isAutoRocket ? (
					<Badge variant="secondary">实盘中</Badge>
				) : (
					<div className="flex items-center gap-1">
						<StrategyEditDialog
							strategy={row.original as SelectStgType}
							rowIndex={row.index}
							fusionIndex={fusionIndex}
						/>
						{!isDisabled && (
							<DeleteStrategy
								strategy={row.original as SelectStgType}
								rowIndex={row.index}
								strategyType="select"
								onSuccess={refresh}
								className="!relative !inset-auto"
							/>
						)}
					</div>
				)
			},
		},
	]
}

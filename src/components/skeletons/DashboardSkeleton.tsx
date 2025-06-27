import React from "react";
import ManagerSidebar from "@/components/manager/ManagerSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const DashboardSkeleton: React.FC = () => {
	return (
		<div className="flex flex-1 overflow-hidden">
			{/* Sidebar Navigation */}
			<ManagerSidebar
				isOpen={true}
				onClose={() => { }}
				isMobile={false}
				onLogout={() => { }}
			/>
			{/* Main Content */}
			<main className="flex-1 overflow-y-auto p-4 lg:p-8 transition-all duration-300">
				{/* Quick Actions Card - full width, first */}
				<div className="mb-8">
					<Card className="shadow-md rounded-2xl border border-slate-300 bg-white/95 w-full">
						<CardHeader className="pb-1 border-b border-slate-300">
							<div>
								<CardTitle className="text-lg font-semibold">
									<div className="h-5 w-32 bg-slate-100 rounded animate-pulse" />
								</CardTitle>
								<CardDescription className="mt-3">
									<span className="inline-block h-5 w-48 bg-slate-100 rounded animate-pulse"></span>
								</CardDescription>
							</div>
						</CardHeader>
						<CardContent className="p-6 pt-4">
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
								{[...Array(4)].map((_, i) => (
									<div key={i} className="h-9 bg-slate-100 rounded-lg animate-pulse" />
								))}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Main Grid Layout */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Left Column - Pending Sessions and Today's Sessions */}
					<div className="lg:col-span-2 space-y-8">
						{/* Today's Sessions */}
						<Card className="shadow-md rounded-2xl border border-slate-300 bg-white/95">
							<CardHeader className="pb-2 border-b border-slate-300">
								<div className="flex items-center justify-between">
									<div>
										<CardTitle className="text-lg font-semibold">
											<span className="inline-block h-6 w-32 bg-slate-100 rounded animate-pulse"></span>
										</CardTitle>
										<CardDescription className="mt-2">
											<span className="inline-block h-5 w-48 bg-slate-100 rounded animate-pulse"></span>
										</CardDescription>
									</div>
									<div className="h-7 w-20 bg-slate-100 rounded animate-pulse" />
								</div>
							</CardHeader>
							<CardContent className="p-6 pt-4">
								<div className="space-y-4">
									{[...Array(3)].map((_, i) => (
										<div key={i} className="p-4 border rounded-lg bg-white border-slate-300 mb-2">
											<div className="flex justify-between items-center">
												<div className="flex flex-col justify-center">
													<div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
													<div className="h-3 w-32 bg-slate-100 rounded mt-1 animate-pulse" />
												</div>
												<div className="h-6 w-16 bg-slate-100 rounded animate-pulse" />
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>

						{/* Pending Volunteers */}
						<Card className="shadow-md rounded-2xl border border-slate-300 bg-white/95">
							<CardHeader className="pb-2 border-b border-slate-300">
								<div className="flex items-center justify-between">
									<div>
										<CardTitle className="text-lg font-semibold">
											<span className="inline-block h-6 w-32 bg-slate-100 rounded animate-pulse"></span>
										</CardTitle>
										<CardDescription className="mt-2">
											<span className="inline-block h-5 w-48 bg-slate-100 rounded animate-pulse"></span>
										</CardDescription>
									</div>
									<div className="h-7 w-20 bg-slate-100 rounded animate-pulse" />
								</div>
							</CardHeader>
							<CardContent className="p-6 pt-4">
								<div className="space-y-4">
									{[...Array(3)].map((_, i) => (
										<div key={i} className="p-4 border rounded-lg bg-white border-slate-300 mb-2">
											<div className="flex justify-between items-center">
												<div className="flex flex-col justify-center">
													<div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
													<div className="h-3 w-32 bg-slate-100 rounded mt-1 animate-pulse" />
												</div>
												<div className="h-8 w-20 bg-slate-100 rounded animate-pulse" />
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Right Column - Quick Stats */}
					<div className="space-y-8">
						<Card className="shadow-md rounded-2xl border border-slate-300 bg-white/95">
							<CardHeader className="pb-2 border-b border-slate-300">
								<div>
									<CardTitle className="text-lg font-semibold">
										<span className="inline-block h-6 w-32 bg-slate-100 rounded animate-pulse"></span>
									</CardTitle>
									<CardDescription className="mt-2">
										<span className="inline-block h-5 w-48 bg-slate-100 rounded animate-pulse"></span>
									</CardDescription>
								</div>
							</CardHeader>
							<CardContent className="p-6 pt-4">
								<div className="space-y-6">
									{[...Array(6)].map((_, i) => (
										<div key={i} className="flex items-center justify-between">
											<div>
												<div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
												<div className="h-8 w-16 bg-slate-100 rounded mt-1 animate-pulse" />
											</div>
											<div className="h-12 w-12 bg-slate-100 rounded-full animate-pulse" />
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</div>
				</div>

				{/* New Widgets Section - Two columns layout */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
					{/* Left Column - Two rectangular widgets stacked */}
					<div className="lg:col-span-2 space-y-8">
						{/* Volunteers Checked In Today */}
						<Card className="shadow-md rounded-2xl border border-slate-300 bg-white/95">
							<CardHeader className="pb-2 border-b border-slate-300">
								<div className="flex items-center justify-between">
									<div>
										<CardTitle className="text-lg font-semibold">
											<span className="inline-block h-6 w-32 bg-slate-100 rounded animate-pulse"></span>
										</CardTitle>
										<CardDescription className="mt-2">
											<span className="inline-block h-5 w-48 bg-slate-100 rounded animate-pulse"></span>
										</CardDescription>
									</div>
									<div className="h-7 w-20 bg-slate-100 rounded animate-pulse" />
								</div>
							</CardHeader>
							<CardContent className="p-6 pt-4">
								<div className="space-y-4">
									{[...Array(3)].map((_, i) => (
										<div key={i} className="p-4 border rounded-lg bg-emerald-50 border-emerald-200 mb-2 flex justify-between items-center">
											<div>
												<div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
												<div className="h-3 w-32 bg-slate-100 rounded mt-1 animate-pulse" />
											</div>
											<div className="h-9 w-9 bg-emerald-400 rounded-full animate-pulse" />
										</div>
									))}
								</div>
							</CardContent>
						</Card>

						{/* Volunteers with Missing Attendance */}
						<Card className="shadow-md rounded-2xl border border-slate-300 bg-white/95">
							<CardHeader className="pb-2 border-b border-slate-300">
								<div className="flex items-center justify-between">
									<div>
										<CardTitle className="text-lg font-semibold">
											<span className="inline-block h-6 w-32 bg-slate-100 rounded animate-pulse"></span>
										</CardTitle>
										<CardDescription className="mt-2">
											<span className="inline-block h-5 w-48 bg-slate-100 rounded animate-pulse"></span>
										</CardDescription>
									</div>
									<div className="h-7 w-20 bg-slate-100 rounded animate-pulse" />
								</div>
							</CardHeader>
							<CardContent className="p-6 pt-4">
								<div className="space-y-4">
									{[...Array(3)].map((_, i) => (
										<div key={i} className="p-4 border rounded-lg bg-red-50 border-red-200 mb-2 flex justify-between items-center">
											<div>
												<div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
												<div className="h-3 w-32 bg-slate-100 rounded mt-1 animate-pulse" />
											</div>
											<div className="h-9 w-9 bg-red-400 rounded-full animate-pulse" />
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Right Column - Performance Alerts */}
					<div className="lg:col-span-1">
						<Card className="shadow-md rounded-2xl border border-slate-300 bg-white/95">
							<CardHeader className="pb-2 border-b border-slate-300">
								<div>
									<CardTitle className="text-lg font-semibold">
										<span className="inline-block h-6 w-32 bg-slate-100 rounded animate-pulse"></span>
									</CardTitle>
									<CardDescription className="mt-2">
										<span className="inline-block h-5 w-48 bg-slate-100 rounded animate-pulse"></span>
									</CardDescription>
								</div>
							</CardHeader>
							<CardContent className="p-6 pt-4">
								<div className="space-y-4">
									{[...Array(5)].map((_, i) => (
										<div key={i} className="p-3 border rounded-lg border-slate-200 bg-slate-50">
											<div className="flex items-center justify-between">
												<div className="flex items-center space-x-4 flex-1">
													<div className="h-10 w-10 rounded-full bg-slate-100 animate-pulse" />
													<div className="flex-1">
														<div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
														<div className="h-3 w-24 bg-slate-100 rounded mt-1 animate-pulse" />
													</div>
												</div>
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</main>
		</div>
	);
};

export default DashboardSkeleton; 
import React from "react";
import { Menu, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ManagerSidebar from "@/components/manager/ManagerSidebar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const DashboardSkeleton: React.FC = () => {
	return (
		<div className="h-screen flex flex-col bg-slate-50">
			{/* Top Header */}
			<header className="bg-white border-b border-slate-200 shadow-sm z-10">
				<div className="px-6 py-3 flex justify-between items-center">
					<div className="flex items-center space-x-4">
						<Button variant="ghost" size="icon" className="lg:hidden">
							<Menu className="h-5 w-5" />
						</Button>
						<div className="flex items-center space-x-2">
							<BarChart3 className="h-6 w-6 text-primary" />
							<h1 className="font-bold text-xl hidden sm:block">Volunteer Management System</h1>
						</div>
					</div>
					<div className="flex items-center space-x-4">
						<div className="h-10 w-10 bg-slate-100 rounded-full animate-pulse" />
					</div>
				</div>
			</header>

			{/* Main Content */}
			<div className="flex flex-1 overflow-hidden">
				{/* Sidebar */}
				<ManagerSidebar isOpen={true} onClose={() => { }} isMobile={false} onLogout={() => { }} />

				{/* Dashboard Content */}
				<main className="flex-1 overflow-y-auto p-4 lg:p-6">
					{/* Page Title */}
					<div className="mb-6">
						<div className="h-8 w-48 bg-slate-100 rounded animate-pulse" />
						<div className="h-4 w-64 bg-slate-100 rounded mt-2 animate-pulse" />
					</div>

					{/* Performance Metrics */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
						{[...Array(4)].map((_, i) => (
							<Card key={i}>
								<CardContent className="p-6">
									<div className="flex items-center justify-between">
										<div>
											<div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
											<div className="h-8 w-16 bg-slate-100 rounded mt-2 animate-pulse" />
										</div>
										<div className="h-12 w-12 bg-slate-100 rounded-full animate-pulse" />
									</div>
									<div className="mt-2">
										<div className="h-2 bg-slate-100 rounded-full animate-pulse" />
									</div>
								</CardContent>
							</Card>
						))}
					</div>

					{/* Main Grid Layout */}
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						{/* Left Column */}
						<div className="lg:col-span-2 space-y-6">
							{/* Pending Volunteers Card */}
							<Card>
								<CardHeader className="pb-2">
									<div className="flex items-center justify-between">
										<div>
											<div className="h-6 w-32 bg-slate-100 rounded animate-pulse" />
											<div className="h-4 w-48 bg-slate-100 rounded mt-1 animate-pulse" />
										</div>
										<div className="h-6 w-12 bg-slate-100 rounded animate-pulse" />
									</div>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										{[...Array(3)].map((_, i) => (
											<div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
												<div className="flex items-center space-x-4">
													<div className="h-10 w-10 bg-slate-100 rounded-full animate-pulse" />
													<div>
														<div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
														<div className="h-3 w-32 bg-slate-100 rounded mt-1 animate-pulse" />
													</div>
												</div>
												<div className="h-8 w-20 bg-slate-100 rounded animate-pulse" />
											</div>
										))}
									</div>
								</CardContent>
							</Card>

							{/* Today's Sessions Card */}
							<Card>
								<CardHeader className="pb-2">
									<div className="flex items-center justify-between">
										<div>
											<div className="h-6 w-32 bg-slate-100 rounded animate-pulse" />
											<div className="h-4 w-48 bg-slate-100 rounded mt-1 animate-pulse" />
										</div>
										<div className="h-6 w-12 bg-slate-100 rounded animate-pulse" />
									</div>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										{[...Array(3)].map((_, i) => (
											<div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
												<div className="flex items-center space-x-4">
													<div className="h-10 w-10 bg-slate-100 rounded-full animate-pulse" />
													<div>
														<div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
														<div className="h-3 w-32 bg-slate-100 rounded mt-1 animate-pulse" />
													</div>
												</div>
												<div className="h-6 w-16 bg-slate-100 rounded animate-pulse" />
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Right Column */}
						<div className="space-y-6">
							{/* Quick Actions Card */}
							<Card>
								<CardHeader className="pb-2">
									<div>
										<div className="h-6 w-32 bg-slate-100 rounded animate-pulse" />
										<div className="h-4 w-48 bg-slate-100 rounded mt-1 animate-pulse" />
									</div>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-2 gap-4">
										{[...Array(4)].map((_, i) => (
											<div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
										))}
									</div>
								</CardContent>
							</Card>

							{/* Quick Stats Card */}
							<Card>
								<CardHeader className="pb-2">
									<div>
										<div className="h-6 w-32 bg-slate-100 rounded animate-pulse" />
										<div className="h-4 w-48 bg-slate-100 rounded mt-1 animate-pulse" />
									</div>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										{[...Array(3)].map((_, i) => (
											<div key={i} className="flex items-center justify-between">
												<div>
													<div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
													<div className="h-8 w-16 bg-slate-100 rounded mt-1 animate-pulse" />
												</div>
												<div className="h-10 w-10 bg-slate-100 rounded-full animate-pulse" />
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</main>
			</div>
		</div>
	);
};

export default DashboardSkeleton;

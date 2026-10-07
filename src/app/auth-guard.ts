import { Injectable } from "@angular/core";
import {
	ActivatedRouteSnapshot,
	CanActivate,
	Router,
} from "@angular/router";
import { LoginService } from "./services/auth/login.service";
import { RouteAccessService } from "./services/permissions/route-access.service";

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private router: Router,
		private loginservice: LoginService,
		private routeAccess: RouteAccessService
	) { }

	async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
		const isAuthorised = this.getAuthStatus();

		if (!isAuthorised) {
			const data = {
				username: 'guest@gmail.com',
				password: 'guest@123'
			};

			try {
				const res: any = await this.loginservice.userLogin(data).toPromise();

				if (res && res.message === "Login successful") {
					localStorage.setItem("isAuthorised", JSON.stringify(res));

					const modeData = {
						selectedMode: 'Data-entry'
					};
					localStorage.setItem("selectedMode", JSON.stringify(modeData));

					await this.router.navigate([this.getLandingRoute()]);
				} else {
					alert(res.message);
					return false;
				}
			} catch (error) {
				console.error("Login failed", error);
				alert("An error occurred during login.");
				return false;
			}
		}

		const isAuthenticated = this.getAuthStatus();
		const currentUserType = this.getUserType();
		const requestedUrl = this.getFullRequestedUrl(route);

		if (!isAuthenticated) {
			await this.router.navigate(['/login']);
			return false;
		}

		// 1) Dynamic catalog from Route Management (TNSMART-style overlay)
		const managed = this.routeAccess.evaluate(requestedUrl, currentUserType);
		if (managed !== null) {
			if (managed) return true;
			await this.router.navigate([this.getLandingRoute()]);
			return false;
		}

		// 2) Fallback: static allowedUsers on the route tree (existing iRAINS behaviour)
		const allowedUsers = this.collectAllowedUsers(route);
		if (allowedUsers.length === 0 || allowedUsers.includes(currentUserType)) {
			return true;
		}

		await this.router.navigate([this.getLandingRoute()]);
		return false;
	}

	/**
	 * Where a user should land by default.
	 * Guest/public logins open on the iRAINS dashboard; every other role keeps
	 * the existing /all-maps landing.
	 */
	getLandingRoute(): string {
		return this.getUserType() === 'public' ? '/irains-dashboard' : '/all-maps';
	}

	getUserType(): string {
		const token = localStorage.getItem('isAuthorised');
		if (!token) return '';
		try {
			const parsedToken = JSON.parse(token);
			return parsedToken?.data?.[0]?.mcorhq || '';
		} catch (error) {
			console.error('Error parsing token:', error);
			return '';
		}
	}

	getAuthStatus(): boolean {
		return !!localStorage.getItem('isAuthorised');
	}

	/** Build full path like /data-management/rbac (TNSMART pattern). */
	private getFullRequestedUrl(route: ActivatedRouteSnapshot): string {
		const segments: string[] = [];
		let current: ActivatedRouteSnapshot | null = route;

		while (current) {
			current.url.forEach(seg => {
				if (seg.path) segments.push(seg.path);
			});
			current = current.parent;
		}

		const fromParents = segments.reverse();

		// Also walk firstChild chain so parent-guard runs see the child URL
		current = route.firstChild;
		while (current) {
			current.url.forEach(seg => {
				if (seg.path) fromParents.push(seg.path);
			});
			current = current.firstChild;
		}

		const path = fromParents.join('/');
		return path ? (path.startsWith('/') ? path : '/' + path) : '/';
	}

	private collectAllowedUsers(route: ActivatedRouteSnapshot): string[] {
		const roles: string[] = [];
		let current: ActivatedRouteSnapshot | null = route;
		while (current) {
			const list = current.data?.['allowedUsers'] as string[] | undefined;
			if (Array.isArray(list) && list.length) {
				roles.push(...list.map(r => String(r).toLowerCase()));
			}
			current = current.parent;
		}
		return Array.from(new Set(roles));
	}
}

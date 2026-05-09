"use client";

import { Fragment } from "react";
import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

type AppBreadcrumbProps = {
  rootHref: string;
  rootLabel: string;
  routeLabels?: Record<string, string>;
};

function normalizePath(path: string) {
  if (path === "/") return path;
  return path.replace(/\/+$/, "");
}

function titleizeSegment(segment: string) {
  return segment
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function AppBreadcrumb({ rootHref, rootLabel, routeLabels = {} }: AppBreadcrumbProps) {
  const pathname = normalizePath(usePathname());
  const normalizedRootHref = normalizePath(rootHref);
  const rootSegments = normalizedRootHref.split("/").filter(Boolean);
  const pathSegments = pathname.split("/").filter(Boolean);
  const relativeSegments = pathSegments.slice(rootSegments.length);

  const crumbs = [
    {
      href: normalizedRootHref,
      label: routeLabels[normalizedRootHref] ?? rootLabel
    },
    ...relativeSegments.map((segment, index) => {
      const href = `/${[...rootSegments, ...relativeSegments.slice(0, index + 1)].join("/")}`;

      return {
        href,
        label: routeLabels[href] ?? titleizeSegment(segment)
      };
    })
  ];

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          const isRootLink = index === 0 && !isLast;

          return (
            <Fragment key={crumb.href}>
              <BreadcrumbItem className={isRootLink ? "hidden md:block" : undefined}>
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast ? <BreadcrumbSeparator className={isRootLink ? "hidden md:block" : undefined} /> : null}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

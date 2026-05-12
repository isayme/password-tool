.PHONY: buildweb
buildweb:
	rm -rf dist
	cd web && pnpm run build && cp -r dist ../dist

.PHONE: edgeone-dev
edgeone-dev:
	edgeone pages dev

.PHONE: edgeone-deploy
edgeone-deploy:
	edgeone pages deploy

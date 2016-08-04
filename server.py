import sys, os
sys.path.append(os.path.dirname(__file__))
import web
import pages.overview
import pages.map
import pages.stats

# Manage routing from here. Regex matches URL and chooses class by name
urls = (
    # '/', 'pages.overview.Overview',  # matched groups (in parens) are sent as arguments
    '/', 'pages.map.Map',  # Omit the overview page and go straight to map (no content in overview anyway)
    '/overview', 'pages.overview.Overview',
    '/map', 'pages.map.Map',
    '/stats', 'pages.stats.Stats',
    '/query', 'pages.query.Query',
    '/details', 'pages.details.Details'
)


if __name__ == "__main__":
    app = web.application(urls, globals())
    app.run()

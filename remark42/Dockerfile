# Custom Remark42 image with style overrides
# Pin to v1.15.0 to prevent CSS structure changes from breaking customizations
FROM umputun/remark42:v1.15.0

# Append custom CSS overrides to the built-in stylesheet
COPY web/custom.css /tmp/custom.css
RUN cat /tmp/custom.css >> /srv/web/remark.css && rm /tmp/custom.css

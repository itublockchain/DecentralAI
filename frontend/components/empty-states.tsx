import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Database, Upload } from "lucide-react"

export function NoModelsEmpty() {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-12 text-center">
        <Database className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Models Found</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Be the first to contribute data and help train new AI models in this domain.
        </p>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Contribute Data
        </Button>
      </CardContent>
    </Card>
  )
}

export function NoDataEmpty() {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-12 text-center">
        <Upload className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Data Uploaded</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Start earning by uploading high-quality datasets to improve AI models.
        </p>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Upload Your First Dataset
        </Button>
      </CardContent>
    </Card>
  )
}
